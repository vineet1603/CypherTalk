document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement("canvas");
  canvas.id = "bg-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "0";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const simplex = new SimplexNoise();
  const points = [];

  for (let i = 0; i < 150; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random(),
      radius: 1 + Math.random() * 1.5
    });
  }

  function animate(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of points) {
      const n = simplex.noise3D(p.x * 0.001, p.y * 0.001, t * 0.0005);
      p.angle += n * 0.05;
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  animate(0);

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
});