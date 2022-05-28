const code = /* language=WGSL */ `
  struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>
  };

  let positions = array<vec2<f32>,3>(
    vec2( 0.0,  0.5), 
    vec2(-0.5, -0.5), 
    vec2( 0.5, -0.5)
  );

  let colors = array<vec3<f32>,3>(
    vec3(0.0, 1.0, 1.0), 
    vec3(0.0, 0.0, 1.0), 
    vec3(1.0, 0.0, 1.0)
  );

  @stage(vertex)
  fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VSOutput {
    return VSOutput(
      vec4(positions[vertexIndex], 0.0, 1.0),
      vec4(colors[vertexIndex], 1.0)
    );
  }

  @stage(fragment)
  fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
  }`

const render = async (gpu, canvasContext) => {
  // canvas independent part
  const device = await (await gpu.requestAdapter()).requestDevice()
  const format = gpu.getPreferredCanvasFormat() // 'bgra8unorm'
  const commandEncoder = device.createCommandEncoder()
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({ code }),
      entryPoint: 'vs_main',
    },
    fragment: {
      module: device.createShaderModule({ code }),
      entryPoint: 'fs_main',
      targets: [{ format }],
    },
    primitive: { topology: 'triangle-list' },
  })

  // canvas dependent part
  canvasContext.configure({ device, format, alphaMode: 'premultiplied' })
  const passEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: canvasContext.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0.05, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  })
  passEncoder.setPipeline(pipeline)
  passEncoder.draw(3, 1, 0, 0)
  passEncoder.end()

  // draw
  device.queue.submit([commandEncoder.finish()])
}

if (navigator.gpu) {
  render(
    navigator.gpu,
    document.getElementById('canvas').getContext('webgpu')
  ).then()
} else {
  alert('WebGPU is not supported or is not enabled, see https://webgpu.io')
}
