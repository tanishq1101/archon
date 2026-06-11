import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function AnimatedBackground() {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;

        // Configuration
        let width = (canvas.width = canvas.offsetWidth);
        let height = (canvas.height = canvas.offsetHeight);

        const particleCount = Math.min(80, Math.floor((width * height) / 15000));
        const particles = [];
        const mouse = { x: null, y: null, radius: 150 };

        // Colors based on theme
        const isDark = theme === "dark";
        const particleColor = isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(99, 102, 241, 0.25)";
        const lineColor = isDark ? "rgba(6, 182, 212, 0.12)" : "rgba(99, 102, 241, 0.08)";
        const activeLineColor = isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(99, 102, 241, 0.18)";

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 2 + 1;
            }

            update() {
                // Interactive mouse repulsion/attraction
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        // Move slightly towards/away depending on design
                        this.x -= (dx / dist) * force * 0.8;
                        this.y -= (dy / dist) * force * 0.8;
                    }
                }

                // Standard motion
                this.x += this.vx;
                this.y += this.vy;

                // Bounce boundaries
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Adjust positioning if out of bounds
                if (this.x < 0) this.x = 0;
                if (this.x > width) this.x = width;
                if (this.y < 0) this.y = 0;
                if (this.y > height) this.y = height;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            }
        }

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Mouse listeners
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update & Draw particles
            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < 100) {
                        const alpha = (100 - dist) / 100;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);

                        // If near mouse, light up the lines
                        let isNearMouse = false;
                        if (mouse.x !== null && mouse.y !== null) {
                            const mDistI = Math.hypot(mouse.x - particles[i].x, mouse.y - particles[i].y);
                            const mDistJ = Math.hypot(mouse.x - particles[j].x, mouse.y - particles[j].y);
                            if (mDistI < mouse.radius && mDistJ < mouse.radius) {
                                isNearMouse = true;
                            }
                        }

                        ctx.strokeStyle = isNearMouse ? activeLineColor : lineColor;
                        ctx.lineWidth = isNearMouse ? 0.8 : 0.4;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", handleResize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ opacity: 0.8 }}
        />
    );
}
