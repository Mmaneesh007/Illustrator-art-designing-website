document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    const brushSize = document.getElementById('brush-size');
    const brushOpacity = document.getElementById('brush-opacity');
    const colorPicker = document.getElementById('color-picker');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const clearBtn = document.getElementById('clear-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const toolStatus = document.getElementById('tool-status');
    const saveStatus = document.getElementById('save-status');

    let isDrawing = false;
    let currentTool = 'brush';
    let startX, startY;
    let snapshot;

    // --- Initial Setup ---
    function initCanvas() {
        const container = document.querySelector('.canvas-container');
        canvas.width = container.clientWidth - 100;
        canvas.height = container.clientHeight - 40;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Fill background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load Auto-save
        const savedData = localStorage.getItem('calqube_studio_save');
        if (savedData) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = savedData;
        }
    }

    initCanvas();
    window.addEventListener('resize', () => {
        // Warning: Resizing clears canvas in standard implementation
        // For Elite, we usually want to persist data, but for MVP we re-init
    });

    // --- Tool Logic ---
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            toolStatus.innerText = `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Active`;
        });
    });

    // --- Drawing Engine ---
    function startDraw(e) {
        isDrawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
        ctx.beginPath();
        ctx.lineWidth = brushSize.value;
        ctx.strokeStyle = colorPicker.value;
        ctx.globalAlpha = brushOpacity.value / 100;
        
        // Snapshot for shapes
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (currentTool === 'brush') {
            ctx.moveTo(startX, startY);
        }
    }

    function drawing(e) {
        if (!isDrawing) return;
        
        if (currentTool === 'brush' || currentTool === 'eraser') {
            if (currentTool === 'eraser') {
                ctx.strokeStyle = '#111';
            }
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        } else {
            // Shapes
            ctx.putImageData(snapshot, 0, 0);
            if (currentTool === 'line') {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            } else if (currentTool === 'circle') {
                ctx.beginPath();
                let radius = Math.sqrt(Math.pow(startX - e.offsetX, 2) + Math.pow(startY - e.offsetY, 2));
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (currentTool === 'rect') {
                ctx.strokeRect(e.offsetX, e.offsetY, startX - e.offsetX, startY - e.offsetY);
            }
        }
    }

    function stopDraw() {
        isDrawing = false;
        autoSave();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', drawing);
    window.addEventListener('mouseup', stopDraw);

    // --- Actions ---
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            autoSave();
        }
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `calqube-artwork-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });

    // --- Auto-Save ---
    function autoSave() {
        saveStatus.innerText = 'Saving...';
        localStorage.setItem('calqube_studio_save', canvas.toDataURL());
        setTimeout(() => {
            saveStatus.innerText = 'Saved';
        }, 1000);
    }
});
