import { zzfx } from "https://esm.sh/zzfx";
import { Newgrounds } from "https://esm.sh/medal-popup";

const DEBUG = false;

document.addEventListener("DOMContentLoaded", async function () {
  const ng = new Newgrounds({
    game: "Deeply Missing",
    url: "https://www.newgrounds.com/portal/view/6587566",
    key: "60029:A9A2Gh9m",
    skey: "PdHysM38hrcqHiKIaFOYTQ==",
  });
  window.ng = ng;
  let audioPlayed = false;
  const audio = new Audio("deep-sadness.mp3");
  function playAudio(loop) {
    if (audioPlayed) {
      return;
    }
    audioPlayed = true;
    audio.volume = 0.5;
    audio.loop = loop ?? false;
    audio.play();
  }
  window.playAudio = playAudio;
  // document.addEventListener("click", playAudio, { once: true });
  // document.addEventListener("touchstart", playAudio, { once: true });

  // Load sprite sheet
  const SIZE = 512;
  const spriteSheet = await (async () => {
    const image = new Image();
    await new Promise((resolve) => {
      image.src = "deep.png";
      image.onload = resolve;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.width / 2;
    canvas.height = image.height / 2;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  })();

  // Setup canvas
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.width = window.innerWidth * 2;
  canvas.height = window.innerHeight * 2;
  canvas.style.width = `${canvas.width * 0.67}px`;
  canvas.style.height = `${canvas.height * 0.67}px`;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "-1";
  document.body.appendChild(canvas);

  // Get WebGL context
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  // Clear canvas
  gl.clearColor(0.0, 0.0, 0.2, 1.0); // RGBA: dark red background
  gl.clear(gl.COLOR_BUFFER_BIT);

  const createProgram = ({ vertex, fragment }) => {
    // Create shader program
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    return program;
  };

  const spriteProgram = createProgram({
    vertex: `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `,
    fragment: `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec4 u_color;
    uniform float u_fade;
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord) * u_color;
      if (color.a < .5) discard;
      gl_FragColor = vec4(color.rgb * (1.0 - u_fade), color.a);
    }
  `,
  });

  const gradientProgram = createProgram({
    vertex: `
      attribute vec2 a_position;
      varying float v_gradientFactor;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_gradientFactor = (a_position.y + 1.0) / 2.0; // Map y from [-1, 1] to [0, 1]
      }
    `,
    fragment: `
      precision mediump float;
      varying float v_gradientFactor;
      uniform vec4 u_topColor;
      uniform vec4 u_bottomColor;
      uniform float u_fade;
      void main() {
        vec4 color = mix(u_bottomColor, u_topColor, v_gradientFactor);
        gl_FragColor = vec4(color.rgb * (1.0 - u_fade), color.a);
      }
    `,
  });

  // Create texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    spriteSheet
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Set up buffers
  const positionBuffer = gl.createBuffer();
  const texCoordBuffer = gl.createBuffer();

  const spritesToDisplay = [];
  function addSprite(x, y, w, h, frames = [0], options = {}) {
    spritesToDisplay.push({
      x,
      y,
      w,
      h,
      frames,
      options,
      pos: options.pos,
      isElement: options.isElement,
      type: "sprite",
    });
  }

  function addBackground(x, y, w, h, color, level, zIndex, tint, pos) {
    if (tint) {
      color = color.map((col) => [
        tint[0] * col[0],
        tint[1] * col[1],
        tint[2] * col[2],
        col[3],
      ]);
    }
    spritesToDisplay.push({
      x,
      y,
      w,
      h,
      options: {
        color,
        level,
        zIndex,
      },
      type: "background",
      pos,
    });
  }

  function displaySprite(x, y, w, h, frames = [0], options = {}) {
    const globalFrame = Math.floor(
      (performance.now() - (options.animStart ?? 0)) /
        (options.frameSpeed ?? 100)
    );
    const frameIndex = options.once
      ? Math.min(globalFrame, frames.length - 1)
      : globalFrame % frames.length;
    // Convert pixel coordinates to WebGL coordinates (-1 to 1)
    const actualY = y + (options.level ?? 0);
    const x1 = (x / canvas.width) * 2 - 1;
    const y1 = -((actualY / canvas.height) * 2 - 1);
    const width = w * (options.mirrorFrames ? 0.5 : 1);
    const height = h * (options.half ? 0.5 : 1);
    const x2 = ((x + width) / canvas.width) * 2 - 1;
    const y2 = -(((actualY + height) / canvas.height) * 2 - 1);

    // Position coordinates
    const positions = new Float32Array([
      x1,
      y1,
      x2,
      y1,
      x1,
      y2,
      x1,
      y2,
      x2,
      y1,
      x2,
      y2,
      ...(!options.mirrorFrames
        ? []
        : [x2, y1, x1, y1, x2, y2, x2, y2, x1, y1, x1, y2].map(
            (v, i) => v + (x2 - x1) * (1 - (i % 2))
          )),
    ]);

    // Texture coordinates
    const rows = (spriteSheet.naturalHeight ?? spriteSheet.height) / SIZE;
    const cols = (spriteSheet.naturalWidth ?? spriteSheet.width) / SIZE;
    const totalWidth = spriteSheet.width;
    const frameWidth = SIZE / totalWidth;
    let texX1 = (frame) => (frame % cols) * frameWidth;
    let texX2 = (frame) =>
      texX1(frame % cols) + frameWidth * (options.mirrorFrames ? 0.5 : 1);
    let texY1 = (frame) =>
      Math.floor(frame / cols) *
      (SIZE / (spriteSheet.naturalHeight ?? spriteSheet.height));
    let texY2 = (frame) =>
      texY1(frame) +
      (SIZE * (options.half ? 0.5 : 1)) /
        (spriteSheet.naturalHeight ?? spriteSheet.height);

    const texCoords = new Float32Array([
      texX1(frames[frameIndex]),
      texY1(frames[frameIndex]),
      texX2(frames[frameIndex]),
      texY1(frames[frameIndex]),
      texX1(frames[frameIndex]),
      texY2(frames[frameIndex]),
      texX1(frames[frameIndex]),
      texY2(frames[frameIndex]),
      texX2(frames[frameIndex]),
      texY1(frames[frameIndex]),
      texX2(frames[frameIndex]),
      texY2(frames[frameIndex]),

      ...(!options.mirrorFrames
        ? []
        : [
            texX1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texX2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texX1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texX1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texX2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY1(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texX2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
            texY2(options.mirrorFrames?.[frameIndex] ?? frames[frameIndex]),
          ]),
    ]);

    gl.useProgram(spriteProgram);

    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(spriteProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(spriteProgram, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(spriteProgram, "u_color");
    const color = options.color || [1, 1, 1, 1];
    gl.uniform4f(colorLocation, ...color);

    const fadeLocation = gl.getUniformLocation(spriteProgram, "u_fade");
    gl.uniform1f(fadeLocation, options.cutScene ? 0 : fade);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  }

  const ANIMATIONS = {
    ko: {
      front: {
        frames: [10],
        mirrorFrames: [10],
      },
      back: {
        frames: [10],
        mirrorFrames: [10],
      },
    },
    idle: {
      front: {
        frames: [2],
        mirrorFrames: [2],
      },
      back: {
        frames: [7],
        mirrorFrames: [7],
      },
    },
    walking: {
      front: {
        frames: [0, 1, 2, 3, 4, 3, 2, 1],
        mirrorFrames: [4, 3, 2, 1, 0, 1, 2, 3],
        speed: 100,
      },
      back: {
        frames: [5, 6, 7, 8, 9, 8, 7, 6],
        mirrorFrames: [9, 8, 7, 6, 5, 6, 7, 8],
        speed: 100,
      },
    },
  };

  const DEFINITIONS = {
    player: {
      states: {
        anim: ANIMATIONS,
      },
    },
    npc: {
      states: {
        anim: {
          idle: {
            front: {
              frames: [22],
              mirrorFrames: [22],
            },
          },
        },
      },
    },
    sarah: {
      states: {
        anim: {
          idle: {
            front: {
              frames: [28, 29, 30],
            },
          },
          lift: {
            front: {
              frames: [29, 30, 31, 32],
              once: true,
            },
          },
        },
      },
    },
  };

  let fade = 0;
  let cutSceneIndex = -1;
  let dialogProgress = 0;
  let readProgress = 0;
  const cutScenes = [
    {
      id: "first-responder",
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: [
        "You're not supposed to be there.\nThis place is dangerous.",
        "Please return to the surface.\nWe don't know how deep the crack goes.",
      ],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: ["Were you able to find any survivors?"],
    },
    {
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: [
        "No sign of life yet.\nAs I said,\nyou are putting yourself at great danger.",
        "If you continue,\nyou won't be able to come back up.",
        "We do not have enough resource\nto rescue everyone.",
      ],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: [
        "I understand...",
        "but I have no choice,",
        "I have to find my daughter.",
      ],
      onExit: () => {
        activate("moving-pillars");
      },
      exit: true,
    },
    {
      id: "second-responder",
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: ["Careful about the holes.\nSome people just fall into them."],
      exit: true,
    },
    {
      id: "the-name",
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: [
        "You are not authorized to be here\nYou're hindering our rescue effort!",
      ],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: [
        "You must let me through, officer!",
        "I desperately need to find my daughter!",
      ],
    },
    {
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: ["Let us do our job.\nWe'll let you know once we find her."],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: [
        "No you don't understand!",
        "My daughter needs me,\nI must be the one to find her.",
      ],
    },
    {
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: ["Fine. Just give us her name."],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: ["Her... her name?"],
    },
    {
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: ["Your daughter's name!\nYou don't know that?"],
    },
    {
      face: [12, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12],
      talk: [13, 13, 12, 12, 13],
      dialog: [
        "How dare you insinuate that!",
        "Do you think I would forget\nmy own daughter's name?!",
      ],
    },
    {
      face: [15, 15, 15, 15, 15, 14, 14, 15, 15, 15, 15, 15],
      talk: [16, 15, 15],
      dialog: ["SORRY, I didn't mean\nto sound so HARSH..."],
      onExit: () => {
        activate("her-name");
      },
      exit: true,
    },
  ];

  const FLIPPER_COLOR = [0, 1, 1, 1];
  const FLIPPER_OFF_COLOR = [0, 0, 1, 1];

  const WHITE = [2, 2, 1, 1];
  const PINK = [2, 1, 1, 1];
  const PURPLE = [2, 0, 1, 1];

  function soundy() {
    zzfx(
      ...[
        ,
        ,
        629,
        0.01,
        0.06,
        0.08,
        1,
        3.6,
        ,
        ,
        149,
        0.05,
        ,
        ,
        1.4,
        ,
        ,
        0.7,
        0.05,
      ]
    ); // Pickup 930
  }

  function checkCode(element) {
    console.log(element.code);
    if (element.code === "SARAH") {
      findSarah(element);
    }
  }

  function findSarah(element) {
    element.code = "";
    zzfx(
      ...[
        1.4,
        ,
        478,
        0.06,
        0.14,
        0.24,
        1,
        0.5,
        ,
        18,
        461,
        0.08,
        0.06,
        ,
        ,
        ,
        0.12,
        0.93,
        0.21,
        0.08,
      ]
    ); // Powerup 913

    cells.forEach((c) => {
      if (c.letter) {
        c.onStep = undefined;
        c.color = PURPLE;
      }
    });

    activate("find-sarah");
  }

  let isGameOver = false;
  function gameOver() {
    if (!isGameOver) {
      isGameOver = true;
      player.direction = "front";
      player.anim = "idle";
      player.pause = Date.now() + 1000;
      setTimeout(() => {
        delete player.controls;
        player.anim = "idle";
      }, 1000);
      setTimeout(() => {
        const dbox = getDbox();
        dbox.style.display = "";
        dbox.innerText = "It's over";
        sarah.anim = "lift";
        sarah.animStart = performance.now();
        setTimeout(() => {
          audioPlayed = false;
          playAudio(true);
          ng.unlockMedal("It's over");
        }, 5000);
      }, 3000);
    }
  }

  let scroll = 0;
  let scrollGoal = scroll;
  const cells = [
    {
      pos: [0, 0],
      color: [2, 2, 2, 1],
    },
    {
      pos: [1, 0],
    },
    {
      pos: [0.5, 0.5],
    },
    {
      pos: [1, 0],
    },
    {
      pos: [0, 1],
    },
    {
      pos: [0.5, 1.5],
    },
    {
      pos: [0, 2],
      // movement: "sin",
      level: 0,
      color: [0, 1, 0, 1],
      canDrop: true,
      // color: [2, 1, 0, 1],
      offStep: () => {
        zzfx(
          ...[
            1.6,
            ,
            196,
            0.05,
            0.22,
            0.37,
            1,
            4,
            ,
            ,
            -76,
            0.07,
            0.1,
            ,
            ,
            ,
            ,
            0.82,
            0.12,
            0.29,
            109,
          ]
        ); // Powerup 934
      },
      onStep: () => {
        zzfx(
          ...[
            1.2,
            ,
            495,
            0.01,
            0.06,
            0.3,
            2,
            2.2,
            ,
            ,
            ,
            ,
            ,
            ,
            11,
            0.4,
            ,
            0.65,
            0.01,
          ]
        ); // Hit 933
      },
    },
    {
      pos: [0.5, 2.5],
      level: 100,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = (cell) => {
            cell.onLand = onLand;
            moveCell(cell, 0, -100 / 50);
            cell.level = 100;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;

          cell.onLand = undefined;

          scrollGoal = scroll - 500;
        }
      },
    },
    {
      pos: [1, 5],
      level: 0,
    },
    {
      pos: [1, 6],
      level: 0,
    },
    {
      pos: [1, 7],
    },
    {
      pos: [0.5, 7.5],
    },
    {
      pos: [1, 8],
    },
    {
      pos: [1.5, 7.5],
    },
    {
      pos: [2, 8],
    },
    {
      pos: [2.5, 7.5],
    },
    {
      pos: [2, 7],
    },
    {
      pos: [2.5, 8.5],
    },
    {
      pos: [2.5, 9.5],
    },
    {
      pos: [2, 10],
      level: 20,
    },
    {
      pos: [2, 9],
    },
    {
      pos: [1.5, 8.5],
    },
    {
      pos: [1.5, 10.5],
      level: 50,
    },
    {
      pos: [1, 11],
      level: 90,
    },
    {
      pos: [0.5, 11.5],
      level: 140,
    },
    {
      pos: [0, 12],
      level: 200,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
            moveCell(cell, 0, -200 / 50);
            cell.level = 200;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;
          cell.onLand = undefined;

          scrollGoal = scroll - 500;
        }
      },
    },
    {
      group: "moving-pillars",
      pos: [0.5, 16.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [-0.5, 16.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [0.5, 17.5],
      movement: "-sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [-0.5, 17.5],
      movement: "-sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [0.5, 18.5],
      movement: "-sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [-0.5, 18.5],
      movement: "-sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [0.5, 19.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [-0.5, 19.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [0.5, 20.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [-0.5, 20.5],
      movement: "sin",
      color: [2, 1, 0, 1],
    },
    {
      group: "moving-pillars",
      pos: [0, 21],
      movement: "-sin",
      color: [2, 1, 0, 1],
    },
    {
      pos: [0, 17],
      level: 1000,
    },
    {
      pos: [0, 22],
    },

    {
      pos: [0.5, 22.5],
    },
    {
      checkpoint: true,
      scrollGoal: -1500,
      pos: [0.5, 23.5],
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
          };
          cell.onLand = undefined;
          scrollGoal = cell.scrollGoal;
        }
        ng.unlockMedal("First trial");
      },
    },
    {
      pos: [0.5, 24.5],
    },
    {
      pos: [1, 25],
    },
    {
      pos: [1.5, 25.5],
    },
    {
      pos: [1, 26],
    },
    {
      pos: [0.5, 25.5],
    },
    {
      pos: [0, 25],
    },
    {
      pos: [0, 26],
    },
    {
      pos: [0.5, 26.5],
    },
    {
      pos: [1, 27],
    },
    {
      pos: [1.5, 26.5],
    },
    {
      pos: [1.5, 27.5],
    },
    {
      pos: [0, 27],
    },
    {
      pos: [-0.5, 25.5],
    },
    {
      pos: [-0.5, 26.5],
    },
    {
      pos: [-1, 26],
    },
    {
      pos: [-1, 27],
    },
    {
      pos: [-0.5, 27.5],
    },
    {
      pos: [0, 28],
    },
    {
      pos: [2, 27],
    },
    {
      pos: [2, 26],
    },
    {
      pos: [0.5, 27.5],
      level: 50,
    },
    {
      pos: [0.5, 28.5],
    },
    {
      pos: [1, 28],
      level: 100,
    },
    {
      pos: [1, 29],
      level: 150,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = (cell) => {
            cell.onLand = onLand;
            moveCell(cell, 0, -150 / 50);
            cell.level = 150;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;

          cell.onLand = undefined;
        }
      },
    },
    {
      pos: [0.5, 32.5],
    },
    {
      checkpoint: true,
      scrollGoal: -2000,
      pos: [0.5, 33.5],
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
          };
          cell.onLand = undefined;
          scrollGoal = cell.scrollGoal;
        }
      },
    },
    {
      pos: [0.5, 34.5],
      onStep: () => {
        zzfx(
          ...[
            2,
            ,
            89,
            0.02,
            0.07,
            0.59,
            1,
            2.4,
            ,
            ,
            ,
            ,
            0.18,
            1.7,
            ,
            0.1,
            0.17,
            0.41,
            0.11,
            0.28,
            534,
          ]
        ); // Explosion 972
        cells.forEach((cell) => {
          if (cell.flipper) {
            cell.levelGoal = cell.initialLevelGoal ?? 0;
            cell.color =
              cell.levelGoal >= 100 ? FLIPPER_OFF_COLOR : FLIPPER_COLOR;
          }
        });
      },
    },

    {
      pos: [0, 35],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 35.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 35],
      color: FLIPPER_COLOR,
      flipper: true,
    },

    {
      pos: [-0.5, 35.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0, 36],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [0.5, 36.5],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [1, 36],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [1.5, 35.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2, 36],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1.5, 36.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 37],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 37.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0, 37],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-0.5, 36.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1, 36],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1, 37],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-0.5, 37.5],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [0, 38],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [0.5, 38.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 38],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [1.5, 37.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2, 37],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1, 38],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [-0.5, 38.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0, 39],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 39.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 39],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [1.5, 38.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2, 38],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1.5, 37.5],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [-1.5, 38.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1, 39],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-1, 40],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [-0.5, 39.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0, 40],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2.5, 37.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2.5, 38.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2, 39],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1.5, 39.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [2, 40],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 40],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 40.5],
      color: FLIPPER_COLOR,
      flipper: true,
      levelGoal: 100,
      initialLevelGoal: 100,
    },
    {
      pos: [-0.5, 40.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0, 41],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 41.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1, 41],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [1.5, 40.5],
      color: FLIPPER_COLOR,
      flipper: true,
    },
    {
      pos: [0.5, 42.5],
    },
    {
      pos: [0.5, 43.5],
      level: 20,
    },
    {
      pos: [0.5, 44.5],
      level: 40,
    },
    {
      pos: [0.5, 45.5],
      level: 100,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = (cell) => {
            cell.onLand = onLand;
            moveCell(cell, 0, -100 / 50);
            cell.level = 100;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;
          cell.onLand = undefined;
        }
      },
    },
    {
      pos: [0.5, 48.5],
      checkpoint: true,
      scrollGoal: -2500,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
          };
          cell.onLand = undefined;
          scrollGoal = cell.scrollGoal;
        }
        ng.unlockMedal("Second trial");
      },
    },

    {
      pos: [1, 49],
    },
    {
      group: "her-name",
      pos: [0.5, 49.5],
      color: [1, 0, 0, 1],
      onStep: (element, cell) => {
        if (element.code?.length) {
          element.code = "";
          zzfx(
            ...[
              ,
              ,
              157,
              0.02,
              0.18,
              0.29,
              ,
              0.3,
              -9,
              -25,
              73,
              0.07,
              0.09,
              ,
              ,
              ,
              ,
              0.81,
              0.28,
            ]
          ); // Powerup 920
          cells.forEach((c) => {
            if (c.letter) {
              c.color = WHITE;
            }
          });
        }
      },
    },
    {
      pos: [0, 49],
    },
    {
      pos: [-0.5, 49.5],
    },
    {
      pos: [0, 50],
    },
    {
      group: "her-name",
      letter: "H",
      pos: [0.5, 51.5],
      anim: {
        frames: [23],
        mirrorFrames: [23],
      },
      color: WHITE,
      onStep: (element, cell) => {
        element.code = (element.code ?? "") + cell.letter;
        cell.color = cell.color === WHITE ? PINK : PURPLE;
        soundy();
        checkCode(element);
      },
    },
    {
      pos: [1, 50],
    },
    {
      pos: [1.5, 49.5],
    },
    {
      pos: [1.5, 50.5],
    },
    {
      group: "her-name",
      letter: "R",
      pos: [1.5, 52.5],
      anim: {
        frames: [24],
        mirrorFrames: [25],
      },
      color: WHITE,
      onStep: (element, cell) => {
        element.code = (element.code ?? "") + cell.letter;
        cell.color = cell.color === WHITE ? PINK : PURPLE;
        soundy();
        checkCode(element);
      },
    },
    {
      group: "her-name",
      letter: "S",
      pos: [0.5, 53.5],
      anim: {
        frames: [26],
        mirrorFrames: [27],
      },
      color: WHITE,
      onStep: (element, cell) => {
        element.code = (element.code ?? "") + cell.letter;
        cell.color = cell.color === WHITE ? PINK : PURPLE;
        soundy();
        checkCode(element);
      },
    },
    {
      group: "her-name",
      letter: "A",
      pos: [-0.5, 52.5],
      anim: {
        frames: [24],
        mirrorFrames: [24],
      },
      color: WHITE,
      onStep: (element, cell) => {
        element.code = (element.code ?? "") + cell.letter;
        cell.color = cell.color === WHITE ? PINK : PURPLE;
        soundy();
        checkCode(element);
      },
    },
    {
      pos: [-0.5, 50.5],
    },
    {
      pos: [0, 51],
    },
    {
      pos: [0.5, 50.5],
    },
    {
      pos: [1, 51],
    },
    {
      pos: [1, 52],
    },
    {
      pos: [0, 52],
    },
    {
      pos: [0.5, 52.5],
    },
    {
      pos: [-0.5, 51.5],
    },
    {
      pos: [1.5, 51.5],
    },
    {
      pos: [1, 53],
    },
    {
      pos: [0, 53],
    },
    {
      pos: [1, 53],
    },
    {
      pos: [0, 53],
    },

    {
      group: "find-sarah",
      pos: [0.5, 54.5],
      level: 50,
    },
    {
      group: "find-sarah",
      pos: [0.5, 55.5],
      level: 100,

      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = (cell) => {
            cell.onLand = onLand;
            moveCell(cell, 0, -100 / 50);
            cell.level = 100;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;
          cell.onLand = undefined;
        }
      },
    },
    {
      group: "find-sarah",
      pos: [0.5, 58.5],
      checkpoint: true,
      scrollGoal: -3000,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
          };
          cell.onLand = undefined;
          scrollGoal = cell.scrollGoal;
        }
        ng.unlockMedal("Her name");
      },
    },

    {
      pos: [0.5, 59.5],
    },
    {
      pos: [1, 60],
      level: 50,
    },
    {
      pos: [1.5, 60.5],
      level: 100,
    },
    {
      pos: [2, 61],
      level: 150,
    },
    {
      pos: [2.5, 61.5],
      level: 200,
    },
    {
      pos: [2.5, 62.5],
      level: 250,

      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = (cell) => {
            cell.onLand = onLand;
            moveCell(cell, 0, -250 / 50);
            cell.level = 250;
          };

          moveCell(cell, 0, cell.level / 50, element);
          element.level = cell.level = 0;
          cell.onLand = undefined;
        }
      },
    },

    {
      pos: [2, 68],
      scrollGoal: -3500,
      onLand: (element, cell) => {
        if (element.anim !== "ko") {
          const onLand = cell.onLand;
          cell.onRestore = () => {
            cell.onLand = onLand;
          };
          cell.onLand = undefined;
          scrollGoal = cell.scrollGoal;
        }
      },
    },
    {
      pos: [1.5, 68.5],
    },
    {
      pos: [1.5, 69.5],
    },
    {
      pos: [1, 70],
    },
    {
      pos: [0.5, 70.5],
    },
    {
      pos: [0, 70],
    },
    {
      pos: [-1, 70],
    },
    {
      pos: [-1.5, 70.5],
    },
    {
      pos: [-2, 70],
    },
    {
      pos: [-1.5, 69.5],
    },
    {
      pos: [-2, 69],
    },
    {
      pos: [-1, 69],
      onStep: (element, cell) => {
        gameOver();
      },
    },
    {
      pos: [-1.5, 68.5],
    },
    {
      pos: [-1.5, 68.5],
    },
    {
      pos: [8, 51.5],
    },
    {
      pos: [0, 69],
    },
    {
      pos: [-0.5, 68.5],
    },
  ];
  window.cells = cells;
  // setTimeout(() => {
  //   activate("find-sarah");
  // }, 3000);

  const newCells = JSON.parse(localStorage.getItem("new-cells") ?? "[]");
  for (let i = newCells.length - 1; i >= 0; i--) {
    if (cells.find((c) => JSON.stringify(c) === JSON.stringify(newCells[i]))) {
      newCells[i] = newCells[newCells.length - 1];
      newCells.pop();
    } else {
      cells.push({ ...newCells[i] });
    }
  }
  localStorage.setItem("new-cells", JSON.stringify(newCells));

  if (newCells.length && DEBUG) {
    const saveButton = document.body.appendChild(
      document.createElement("button")
    );
    saveButton.id = "save-button";
    saveButton.textContent = "SAVE";
    saveButton.style.position = "absolute";
    saveButton.style.top = "5px";
    saveButton.style.right = "5px";
    saveButton.addEventListener("click", () => {
      // Convert newCells to pretty-printed JSON with 2 spaces indentation
      const jsonString = JSON.stringify(
        newCells.map((c) => {
          const newC = { ...c };
          delete newC.registered;
          if (!newC.level) {
            delete newC.level;
          }
          return newC;
        }),
        null,
        2
      );

      // Create a Blob with the JSON content
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = "newCells.json"; // Filename for the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  }

  let sarah;
  let player;
  const elements = [
    (player = {
      definition: DEFINITIONS.player,
      direction: "front",
      anim: "idle",
      pos: [0, 0],
      controls: true,
      level: 0,
    }),
    {
      definition: DEFINITIONS.npc,
      direction: "front",
      anim: "idle",
      pos: [2, 7],
      level: 0,
      onEncounter: (element, npc) => {
        const onEncounter = npc.onEncounter;
        npc.onRestore = (npc) => {
          npc.onEncounter = onEncounter;
        };
        beginCutscene("first-responder");
        npc.onEncounter = undefined;
      },
      npc: true,
    },
    {
      definition: DEFINITIONS.npc,
      direction: "front",
      anim: "idle",
      pos: [2, 26],
      level: 0,
      onEncounter: (element, npc) => {
        const onEncounter = npc.onEncounter;
        npc.onRestore = (npc) => {
          npc.onEncounter = onEncounter;
        };
        beginCutscene("second-responder");
        npc.onEncounter = undefined;
      },
      npc: true,
    },

    {
      definition: DEFINITIONS.npc,
      direction: "front",
      anim: "idle",
      pos: [-0.5, 49.5],
      level: 0,
      onEncounter: (element, npc) => {
        const onEncounter = npc.onEncounter;
        npc.onRestore = (npc) => {
          npc.onEncounter = onEncounter;
        };
        beginCutscene("the-name");
        npc.onEncounter = undefined;
      },
      npc: true,
    },
    (sarah = {
      definition: DEFINITIONS.sarah,
      direction: "front",
      anim: "idle",
      pos: [-1.5, 70.5],
      level: 0,
      size: 80,
      npc: true,
    }),
  ];

  function moveCell(cell, x, y, element) {
    delete cellRegistry[`${cell.pos[0]}_${cell.pos[1]}`];

    cell.pos[0] += x;
    cell.pos[1] += y;
    if (element) {
      element.pos[0] += x;
      element.pos[1] += y;
    }
    cell.registered = false;
  }

  const keys = {};
  document.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    playAudio();
  });
  document.addEventListener("keyup", (event) => {
    delete keys[event.code];
  });

  const mouse = { x: 0, y: 0, cell: [0, 0] };
  if (DEBUG) {
    document.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX / 0.67;
      mouse.y = event.clientY / 0.67;
      const [mx, my] = pos2cell([mouse.x, mouse.y - scroll], [2, 1], 0.5);
      mouse.cell[0] = mx;
      mouse.cell[1] = my;
    });
    document.addEventListener("click", (event) => {
      if (event.target?.tagName === "BUTTON") {
        return;
      }
      if (!cellRegistry[`${mouse.cell[0]}_${mouse.cell[1]}`]) {
        // return;
        const newCell = {
          pos: [...mouse.cell],
          level: 0,
        };
        newCells.push(newCell);
        cells.push(newCell);
        localStorage.setItem("new-cells", JSON.stringify(newCells));
      } else {
        // const cell = cellRegistry[`${mouse.cell[0]}_${mouse.cell[1]}`];
        // if (cell.flipper) {
        //   cell.levelGoal = cell.levelGoal >= 100 ? 0 : 100;
        //   cell.initialLevelGoal = cell.levelGoal;
        //   cell.color = cell.levelGoal >= 100 ? FLIPPER_OFF_COLOR : FLIPPER_COLOR;
        //   console.log(cell.pos);
        // }
      }
    });
  }

  function activate(group) {
    cells.forEach((cell) => {
      if (cell.group === group) {
        if (cell.hidden) {
          delete cell.hidden;
          cell.reveal = 1000;
          cell.activated = true;
        }
      }
    });
  }

  const cellRegistry = {};
  function updateCell(dt, cell) {
    if (!cell.registered) {
      cellRegistry[`${cell.pos[0]}_${cell.pos[1]}`] = cell;
      cell.registered = true;
      if (!cell.level) {
        cell.level = 0;
      }
      if (cell.group && !cell.activated) {
        cell.hidden = true;
      }
    }
    if (cell.hidden) {
      return;
    } else if (cell.reveal) {
      cell.reveal *= 0.8;
      if (cell.reveal < 1) {
        delete cell.reveal;
      }
    }
    if (cell.movement === "sin") {
      cell.level = Math.sin(performance.now() / 1000) * 100;
    } else if (cell.movement === "-sin") {
      cell.level = -Math.sin(performance.now() / 1000) * 100;
    } else if (cell.orgLevel < cell.level && !cell.element) {
      cell.level = Math.max(cell.level - 1, cell.orgLevel);
    } else if (
      cell.flipper &&
      cell.levelGoal !== undefined &&
      cell.levelGoal !== cell.level
    ) {
      cell.level += (cell.levelGoal - cell.level) / 5;
      if (Math.abs(cell.level - cell.levelGoal) < 1) {
        cell.level = cell.levelGoal;
      }
    }
  }

  function ko(element) {
    element.anim = "ko";
    element.controls = undefined;
    element.pos[1] = element.onCell.pos[1] + 0.3;
    element.fall = 0;

    zzfx(
      ...[
        ,
        ,
        90,
        0.03,
        0.02,
        0.6,
        3,
        1.8,
        -6,
        -4,
        ,
        ,
        ,
        0.1,
        ,
        0.8,
        0.13,
        0.35,
        0.21,
        ,
        736,
      ]
    ); // Explosion 952

    const respawn = {
      ...element,
      anim: "idle",
      pos: [...element.respawn],
      controls: true,
      direction: "front",
      level: 0,
      fall: undefined,
      onCell: undefined,
      scrollRespawn: element.scrollRespawn,
    };
    setTimeout(() => {
      elements.push(respawn);
      player = respawn;
      scrollGoal = respawn.scrollRespawn ?? 0;
      zzfx(
        ...[
          ,
          ,
          158,
          0.02,
          0.14,
          0.39,
          ,
          3.1,
          -3,
          ,
          207,
          0.09,
          0.08,
          ,
          ,
          ,
          ,
          0.88,
          0.26,
          0.36,
        ]
      ); // Powerup 956
    }, 3000);

    cells.forEach((cell) => {
      cell.onRestore?.(cell);
      delete cell.onRestore;
    });
    elements.forEach((element) => {
      element.onRestore?.(element);
      delete element.onRestore;
    });
  }

  function updateElement(dt, element) {
    if (element.npc && !element.placed) {
      const cell = cellRegistry[`${element.pos[0]}_${element.pos[1]}`];
      if (cell) {
        element.placed = true;
        cell.npc = element;
      }
    }
    if (element.controls && element.anim !== "ko" && cutSceneIndex < 0) {
      if (!element.respawn) {
        element.respawn = [...element.pos];
      }
      let gx = 0;
      let gy = 0;
      if (keys["ArrowUp"] || keys["KeyW"]) {
        element.direction = "back";
        gy += -1;
      }
      if (keys["ArrowDown"] || keys["KeyS"]) {
        element.direction = "front";
        gy += 1;
      }
      if (keys["ArrowLeft"] || keys["KeyA"]) {
        gx += -1;
      }
      if (keys["ArrowRight"] || keys["KeyD"]) {
        gx += 1;
      }
      if (element.pause && Date.now() < element.pause) {
        gx = gy = 0;
        if (element.onCell) {
          element.anim = "walking";
          element.pos[0] += (element.onCell.pos[0] - element.pos[0]) / 10;
          element.pos[1] += (element.onCell.pos[1] - element.pos[1]) / 10;
        }
      } else if (gx || gy) {
        element.anim = "walking";
        const dist = Math.sqrt(gx * gx + gy * gy);
        const speed = (0.1 * dt) / 16;
        const nextPosX = element.pos[0] + (gx / dist) * speed * 0.1;
        const nextPosY = element.pos[1] + (gy / dist) * speed * 0.2;
        const nextCell = closestCell([nextPosX, nextPosY], 0.5, element.level);
        let validMove = true;
        if (!nextCell) {
          //console.log("Can't move there");
          validMove = false;
        } else if ((element.level ?? 0) - (nextCell.level ?? 0) > 30) {
          validMove = false;
        }
        if (validMove) {
          element.pos[0] = nextPosX;
          element.pos[1] = nextPosY;
          if (element.onCell !== nextCell) {
            if (element.onCell) {
              element.onCell.offStep?.(element, element.onCell);
              delete element.onCell.element;
            }
            element.onCell = nextCell;
            nextCell.element = element;
            nextCell.onStep?.(element, nextCell);
            //console.log(nextCell.pos);
            if (nextCell.checkpoint) {
              element.respawn = [...nextCell.pos];
              element.scrollRespawn = nextCell.scrollGoal;
            }
            if (nextCell.flipper && !nextCell.levelGoal) {
              zzfx(
                ...[
                  2,
                  ,
                  89,
                  0.02,
                  0.07,
                  0.59,
                  1,
                  2.4,
                  ,
                  ,
                  ,
                  ,
                  0.18,
                  1.7,
                  ,
                  0.1,
                  0.17,
                  0.41,
                  0.11,
                  0.28,
                  534,
                ]
              ); // Explosion 972

              nextCell.light = Date.now() + 300;
              element.pause = Date.now() + 300;
              //  flip cells
              const [cx, cy] = nextCell.pos;
              const adjacents = [
                [-0.5, -0.5],
                [0, -1],
                [0.5, -0.5],
                [-0.5, 0.5],
                [0, 1],
                [0.5, 0.5],
              ];
              adjacents.forEach(([dx, dy]) => {
                const c = cellRegistry[`${cx + dx}_${cy + dy}`];
                if (c && c.flipper) {
                  c.levelGoal = (c.levelGoal ?? c.level) >= 100 ? 0 : 100;
                  c.color =
                    c.levelGoal >= 100 ? FLIPPER_OFF_COLOR : FLIPPER_COLOR;
                }
              });
            }
          }
        }
      } else {
        element.anim = "idle";
      }
    }

    if (element.onCell) {
      if (element.flipper && element.levelGoal >= 100) {
        ko(element);
      } else if (element.level + 30 < element.onCell.level) {
        element.fall = (element.fall ?? 0) + 2;
        element.level = Math.min(
          element.onCell.level,
          element.level + element.fall
        );
      } else {
        if (element.onCell.canDrop) {
          if (!element.onCell.orgLevel) {
            element.onCell.orgLevel = element.onCell.level;
          }
          element.onCell.level = Math.min(
            element.onCell.level + 1,
            element.onCell.orgLevel + 100
          );
        }
        if (element.fall) {
          if (element.fall > 10) {
            ko(element);
          } else {
            zzfx(
              ...[
                2,
                ,
                204,
                0.02,
                ,
                0.04,
                4,
                2.5,
                ,
                ,
                5,
                0.03,
                ,
                ,
                ,
                0.1,
                ,
                0.61,
                0.02,
                ,
                -866,
              ]
            ); // Blip 963
          }
          element.fall = 0;
        }
        element.level = element.onCell.level;
        element.onCell.onLand?.(element, element.onCell);
        element.onCell.npc?.onEncounter?.(element, element.onCell.npc);
      }
    }
  }

  function closestCell(pos, maxDist, level) {
    const low = [Math.floor(pos[0] * 2) / 2, Math.floor(pos[1] * 2) / 2];
    const high = [Math.ceil(pos[0] * 2) / 2, Math.ceil(pos[1] * 2) / 2];
    let closest = null;
    let closestDist = Infinity;
    let topLevel = Infinity;
    const choices = [
      [low[0], low[1]],
      [low[0], high[1]],
      [high[0], low[1]],
      [high[0], high[1]],
    ];
    choices.forEach((choice) => {
      const [cx, cy] = choice;
      if ((cx % 1 === 0 && cy % 1 === 0) || (cx % 1 !== 0 && cy % 1 !== 0)) {
        const dx = pos[0] - cx;
        const dy = pos[1] - cy;
        const dist = dx * dx + dy * dy;
        if (dist > maxDist * maxDist) return;
        const key = `${cx}_${cy}`;
        const cell = cellRegistry[key];
        if (!cell) return;
        if (cell.flipper && cell.levelGoal >= 100 && closest) return;
        if (
          (cell.level < topLevel && cell.level >= level - 30) ||
          dist < closestDist ||
          (closest?.flipper && closest.levelGoal >= 100)
        ) {
          closestDist = dist;
          closest = cell;
          topLevel = cell.level ?? 0;
        }
      }
    });

    return closest;
  }

  function drawElement(element) {
    const anim =
      element.definition.states.anim[element.anim][element.direction];
    const [cx, cy] = element.pos;
    const [px, py] = cell2pos(element.pos, [-10, -70]);
    const position = {
      x: px,
      y: py,
    };
    addSprite(
      position.x,
      position.y,
      element.size ?? 120,
      element.size ?? 120,
      anim.frames,
      {
        mirrorFrames: anim.mirrorFrames,
        frameSpeed: anim.speed,
        color: element.color,
        zIndex: element.onCell ? element.onCell.pos[1] : cy,
        level: element.level,
        pos: element.pos,
        isElement: true,
        once: anim.once,
        animStart: element.animStart,
      }
    );
  }

  function cell2pos(pos, offset = [0, 0], rounding = 0) {
    let x = pos[0] * 128 + 500 + offset[0];
    let y = pos[1] * 50 + 500 + offset[1];
    if (rounding) {
      x = Math.round(x / rounding) * rounding;
      y = Math.round(y / rounding) * rounding;
    }
    return [x, y];
  }

  function pos2cell(cell, offset = [0, 0], rounding = 0) {
    let x = (cell[0] - 500) / 128 + offset[0];
    let y = (cell[1] - 500) / 50 + offset[1];
    if (rounding) {
      x = Math.round(x / rounding) * rounding;
      y = Math.round(y / rounding) * rounding;
    }
    return [x, y];
  }

  function drawCell(cell) {
    if (cell.hidden) {
      return;
    }
    const [x, y] = cell2pos(cell.pos);
    const level = (cell.level || 0) + (cell.reveal ?? 0);
    const zIndex = cell.pos[1];
    addSprite(x, y, 100, 100, cell.anim?.frames ?? [17], {
      mirrorFrames: cell.anim?.mirrorFrames ?? [17],
      color: cell.light && Date.now() < cell.light ? [0, 2, 2, 1] : cell.color,
      level,
      zIndex: zIndex,
      pos: cell.pos,
    });
    addBackground(
      x + 6,
      y,
      22,
      500,
      [
        [0, 0, 1, 1],
        [0, 0, 0, 1],
      ],
      level + 52,
      zIndex,
      cell.color,
      [x, y]
    );
    addBackground(
      x + 28,
      y,
      42,
      500,
      [
        [0.2, 0.3, 1, 1],
        [0, 0, 0, 1],
      ],
      level + 52,
      zIndex,
      cell.color,
      [x, y]
    );
    addBackground(
      x + 70,
      y,
      22,
      500,
      [
        [0, 0, 0.8, 1],
        [0, 0, 0, 1],
      ],
      level + 52,
      zIndex,
      cell.color,
      [x, y]
    );
  }

  function drawGradientRectangle(
    x,
    y,
    width,
    height,
    topColor,
    bottomColor,
    h
  ) {
    // Convert pixel coordinates to WebGL coordinates (-1 to 1)
    const x1 = (x / canvas.width) * 2 - 1;
    const y1 = -((y / canvas.height) * 2 - 1);
    const x2 = ((x + width) / canvas.width) * 2 - 1;
    const y2 = -(((y + height) / canvas.height) * 2 - 1);

    // Position coordinates
    const positions = new Float32Array([
      x1,
      y1,
      x2,
      y1,
      x1,
      y2,
      x1,
      y2,
      x2,
      y1,
      x2,
      y2,
    ]);

    gl.useProgram(gradientProgram);

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Set up position attribute
    const positionLocation = gl.getAttribLocation(
      gradientProgram,
      "a_position"
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set top and bottom colors
    const topColorLocation = gl.getUniformLocation(
      gradientProgram,
      "u_topColor"
    );
    const bottomColorLocation = gl.getUniformLocation(
      gradientProgram,
      "u_bottomColor"
    );
    gl.uniform4f(topColorLocation, ...topColor);
    gl.uniform4f(bottomColorLocation, ...bottomColor);

    const fadeLocation = gl.getUniformLocation(gradientProgram, "u_fade");
    gl.uniform1f(fadeLocation, fade);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  }

  function showAllSprites() {
    spritesToDisplay.sort((a, b) => {
      if (a.options.zIndex < b.options.zIndex) return -1;
      if (a.options.zIndex > b.options.zIndex) return 1;

      if (a.type !== b.type) {
        if (a.type === "background") return -1;
        if (b.type === "background") return 1;
      }

      if (a.isElement !== b.isElement) {
        if (a.isElement) return 1;
        if (b.isElement) return -1;
      }

      if (a.pos[1] < b.pos[1]) return -1;
      if (a.pos[1] > b.pos[1]) return 1;

      return 0;
    });

    spritesToDisplay.forEach((sprite) => {
      if (sprite.type === "background") {
        const {
          x,
          y,
          w,
          h,
          options: { color, level },
        } = sprite;
        drawGradientRectangle(x, y + level + scroll, w, h, color[0], color[1]);
      } else if (sprite.type === "sprite") {
        displaySprite(
          sprite.x,
          sprite.y + scroll,
          sprite.w,
          sprite.h,
          sprite.frames,
          sprite.options
        );
      }
    });
    spritesToDisplay.length = 0;
  }

  function getDbox() {
    return (
      document.getElementById("dbox") ??
      (() => {
        const dbox = document.body.appendChild(document.createElement("div"));
        dbox.id = "dbox";
        dbox.style.position = "absolute";
        dbox.style.fontSize = "30pt";
        dbox.style.color = "#87cefa";
        dbox.style.bottom = "50px";
        dbox.style.width = "100%";
        dbox.style.textAlign = "center";
        dbox.style.fontFamily = "TheFont";
        return dbox;
      })()
    );
  }

  function updateCutscene(dt) {
    if (isGameOver) {
      return;
    }
    if (cutSceneIndex >= 0) {
      const scene = cutScenes[cutSceneIndex];
      const text =
        scene.dialog[
          Math.min(Math.floor(dialogProgress), scene.dialog.length - 1)
        ];
      const textProgress = text.substring(0, Math.floor(readProgress));

      const dialogBox = getDbox();
      dialogBox.style.display = "";
      dialogBox.innerText = textProgress;

      const newRead = Math.min(readProgress + dt / 20, text.length);
      if (readProgress != newRead) {
        if (Math.floor(readProgress) !== Math.floor(newRead)) {
          if (text[newRead] !== " " && Math.random() < 0.5) {
            if (scene.face[0] === 12) {
              zzfx(
                ...[
                  0.3,
                  ,
                  672,
                  0.01,
                  0.02,
                  0.002,
                  3,
                  0.3,
                  11,
                  ,
                  167,
                  0.03,
                  ,
                  ,
                  ,
                  ,
                  ,
                  0.68,
                  0.02,
                  0.14,
                  -708,
                ]
              ); // Blip 908
            } else {
              zzfx(
                ...[
                  2,
                  ,
                  235,
                  0.02,
                  0.01,
                  0.01,
                  ,
                  4.3,
                  ,
                  67,
                  250,
                  0.04,
                  0.12,
                  ,
                  150,
                  ,
                  0.26,
                  0.51,
                  0.03,
                  ,
                  837,
                ]
              ); // Blip 903
            }
          }
        }
        readProgress = newRead;
      }

      const anim = readProgress < text.length ? scene.talk : scene.face;

      if (keys["Space"] && readProgress >= text.length) {
        if (dialogProgress >= scene.dialog.length - 1) {
          if (scene.exit) {
            cutSceneIndex = -1;
            fade = 0;
            scene.onExit?.();
            delete scene.onExit;
          } else {
            cutSceneIndex++;
            readProgress = 0;
            dialogProgress = 0;
          }
        } else {
          readProgress = 0;
          dialogProgress++;
        }
      }

      addSprite(
        (canvas.width * 0.67) / 2 - 200,
        (canvas.height * 0.67) / 2 - 200 - scroll,
        400,
        400,
        anim,
        {
          zIndex: 1000,
          cutScene: true,
          mirrorFrames: anim,
        }
      );
      // {
      //   id: "first-responder",
      //   face: [15],
      //   blink: [14],
      //   talk: [16],
      //   dialog: [
      //     "You're not supposed to be there. This place is dangerous.",
      //     "Please return to the surface. We don't know how deep the crack goes.",
      //   ],
      // },
    } else {
      const dbox = document.getElementById("dbox");
      if (dbox?.style.display === "") {
        dbox.style.display = "none";
      }
    }
  }

  // Initial draw
  let pt = 0;
  const loop = (t) => {
    const dt = Math.min(50, t - pt);
    pt = t;
    cells.forEach((cell) => {
      updateCell(dt, cell);
    });
    elements.forEach((element) => {
      updateElement(dt, element);
    });

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw cells
    cells.forEach((cell) => {
      drawCell(cell);
    });
    //  Draw elements
    elements.forEach((element) => {
      drawElement(element);
    });
    //  mouse
    {
      const [px, py] = cell2pos(mouse.cell);
      addSprite(px, py, 100, 100, [18, 19, 20, 21], {
        mirrorFrames: [18, 19, 20, 21],
        zIndex: mouse.cell[1],
        color: [2, 2, 0, 1],
        pos: [px, py],
      });
      if (
        Math.random() < 0.3 &&
        !cellRegistry[`${mouse.cell[0]}_${mouse.cell[1]}`]
      ) {
        drawCell({
          pos: mouse.cell,
          color: [2, 2, 2, 1],
          level: 0,
        });
      }
    }

    updateCutscene(dt);

    showAllSprites();

    if (scroll !== scrollGoal) {
      const ds = scrollGoal - scroll;
      scroll += (ds / Math.abs(ds)) * Math.min(Math.abs(ds), 5);
    }

    if (cutSceneIndex >= 0) {
      fade = Math.min(0.8, fade + 0.01);
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  function beginCutscene(id) {
    const index = cutScenes.findIndex((scene) => scene.id === id);
    cutSceneIndex = index;
    dialogProgress = 0;
    readProgress = 0;
    player.anim = "idle";
    player.direction = "back";
  }

  if (DEBUG) {
    const nextCheckpoint = document.body.appendChild(
      document.createElement("button")
    );
    nextCheckpoint.style.position = "absolute";
    nextCheckpoint.style.right = "5px";
    nextCheckpoint.style.top = "30px";
    nextCheckpoint.textContent = "next checkpoint";
    nextCheckpoint.addEventListener("click", () => {
      let foundPlayer = false;
      for (let i = 0; i < cells.length; i++) {
        if (
          cells[i].pos[0] === player.pos[0] &&
          cells[i].pos[1] === player.pos[1]
        ) {
          foundPlayer = true;
        } else if (foundPlayer && cells[i].checkpoint) {
          player.pos[0] = cells[i].pos[0];
          player.pos[1] = cells[i].pos[1];
          cells[i].onLand(player, cells[i]);
          scroll = scrollGoal;
          break;
        }
      }
    });
  }
});
