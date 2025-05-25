function startIshyaAgent() {
  (() => {
    const avatar = document.getElementById("ishya-agent");
    const frameSize = 200;
    let x = Math.random() * (window.innerWidth - frameSize);
    let y = Math.random() * (window.innerHeight - frameSize);
    let vx = Math.random() < 0.5 ? 2 : -2;
    let vy = Math.random() < 0.5 ? 1.5 : -1.5;
    let frame = 0;
    let lastFrameTime = 0;
    let frameInterval = 200;
    let isBlinking = false;
    let nextBlink = Date.now() + 3000 + Math.random() * 3000;
    let currentAction = "stand";
    let walkFrames = [], standFrames = [];
    let dragLeftFrames = [], dragRightFrames = [], dropFrames = [];
    let isDragging = false;
    const dragAnchorXLeft = 68;
    const dragAnchorXRight = 55;
    let dragAnchorY = 73;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragAnimFrame = 0;
    let lastDragFrameTime = 0;
    let lastMouseX = 0;
    let isFlipped = false;
    let dragFrameCountdown = 0;
    let walkCooldownUntil = 0;
    let walkDurationUntil = 0;
    let animationFrameId = null;

    const cdnBaseURL = "/assets/ishya/";

    const loadFrames = (action, count) => {
      return Promise.all(
        Array.from({ length: count }, (_, i) => {
          return new Promise(resolve => {
            const img = new Image();
            img.src = `${cdnBaseURL}${action}_${i}.png`;
            img.onload = () => resolve(img);
          });
        })
      );
    };

    const loadSingle = (name) => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = `${cdnBaseURL}${name}.png`;
        img.onload = () => resolve(img);
      });
    };

    const stopLoop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const startLoop = () => {
      stopLoop(); // 确保不会多开
      animationFrameId = requestAnimationFrame(loop);
    };

    const update = () => {
      const now = Date.now();
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      if (!isDragging) {
        if (currentAction === "walk") {
          const currentImg = walkFrames[frame % walkFrames.length];
          if (currentImg.complete) {
            avatar.style.backgroundImage = `url(${currentImg.src})`;
            //console.log("showing walk frame:", currentImg.src); 
          } else {
            //console.warn("skipped incomplete frame:", currentImg.src);
          }
        } else if (currentAction === "stand" && !isBlinking) {
          avatar.style.backgroundImage = `url(${standFrames[0].src})`;
        }

        avatar.style.transform = `scaleX(${vx < 0 ? 1 : -1})`;
        isFlipped = vx >= 0;
      }

      frame++;

      if (currentAction === "walk") {
        x += vx * 2.8;
        y += vy * 2.8;

        const maxX = window.innerWidth - frameSize;
        const maxY = window.innerHeight - frameSize;

        if (x <= 0 || x >= maxX) {
          vx *= -1;
          x = Math.max(0, Math.min(x, maxX));
        }
        if (y <= 0 || y >= maxY) {
          vy *= -1;
          y = Math.max(0, Math.min(y, maxY));
        }

        avatar.style.left = `${x}px`;
        avatar.style.bottom = `${y}px`;

        if (Date.now() > walkDurationUntil) {
          if (Math.random() < 0.2) {
            setAction("stand");
          } else {
            walkDurationUntil = Date.now() + 3000 + Math.random() * 3000;
          }
        }
      }
    };

    const setAction = (action) => {
      if (action !== currentAction) {
        currentAction = action;
        frame = 0;
      }
    };

    const loop = () => {
      update();
      if (!isDragging && currentAction === "stand" && Date.now() >= nextBlink && !isBlinking) {
        isBlinking = true;
        avatar.style.backgroundImage = `url(${standFrames[1].src})`;
        setTimeout(() => {
          avatar.style.backgroundImage = `url(${standFrames[0].src})`;
          isBlinking = false;
        }, 150);
        nextBlink = Date.now() + 3000 + Math.random() * 5000;
      }

      if (!isDragging && Date.now() > walkCooldownUntil && Math.random() < 0.005) {
        if (currentAction === "stand") {
          vx = Math.random() < 0.5 ? 2 : -2;
          vy = Math.random() < 0.5 ? 1.5 : -1.5;
          walkDurationUntil = Date.now() + 3000 + Math.random() * 4000;
          setAction("walk");
        } else {
          setAction("stand");
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    avatar.addEventListener("mousedown", (e) => {
      isDragging = true;
      setAction("lift");
      avatar.style.backgroundImage = `url(${cdnBaseURL}lift.png)`;
      dragOffsetX = isFlipped ? dragAnchorXRight : dragAnchorXLeft;
      dragOffsetY = dragAnchorY;
      stopLoop(); 
      lastMouseX = e.clientX;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        x = e.clientX - dragOffsetX;
        y = window.innerHeight - (e.clientY - dragOffsetY + frameSize);
        avatar.style.left = `${x}px`;
        avatar.style.bottom = `${y}px`;

        const now = Date.now();
        const deltaX = e.clientX - lastMouseX;
        lastMouseX = e.clientX;

        if (Math.abs(deltaX) > 0.5) {
          dragFrameCountdown = 3;
          if (now - lastDragFrameTime > frameInterval) {
            dragAnimFrame++;
            lastDragFrameTime = now;
          }
          if ((deltaX > 0 && !isFlipped) || (deltaX < 0 && isFlipped)) {
            avatar.style.backgroundImage = `url(${dragRightFrames[dragAnimFrame % dragRightFrames.length].src})`;
          } else {
            avatar.style.backgroundImage = `url(${dragLeftFrames[dragAnimFrame % dragLeftFrames.length].src})`;
          }
        } else if (dragFrameCountdown > 0) {
          dragFrameCountdown--;
        } else {
          avatar.style.backgroundImage = `url(${cdnBaseURL}lift.png)`;
        }
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        frame = 0;

        avatar.style.backgroundImage = `url(${dropFrames[0].src})`;

        setTimeout(() => {
          avatar.style.backgroundImage = `url(${dropFrames[1].src})`;

          setTimeout(() => {
            avatar.style.backgroundImage = `url(${dropFrames[2].src})`;

            setTimeout(() => {
              setAction("stand");
              walkCooldownUntil = Date.now() + 1000;
              startLoop();
            }, 60); // drop_2 展示时长
          }, 100); // drop_1 展示时长
        }, 100);   // drop_0 展示时长
      }
    });

    Promise.all([
      loadFrames("walk", 8).then(f => walkFrames = f),
      loadFrames("stand", 2).then(f => standFrames = f),
      loadFrames("drag_left", 2).then(f => dragLeftFrames = f),
      loadFrames("drag_right", 2).then(f => dragRightFrames = f),
      loadFrames("drop", 3).then(f => dropFrames = f),
      loadSingle("lift")
    ]).then(async () => {
      const allFrames = [...walkFrames, ...standFrames, ...dragLeftFrames, ...dragRightFrames, ...dropFrames];
      await Promise.all(
        allFrames.map(img => img.decode().catch(err => {
          console.warn("Decode failed for:", img.src, err);
        }))
      );

      avatar.style.left = `${x}px`;
      avatar.style.bottom = `${y}px`;
      setAction("stand");
      startLoop();
    });

  })();
}

window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");
  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => {
      loader.remove();
      startIshyaAgent();
    }, 800);
  } else {
    startIshyaAgent();
  }
});