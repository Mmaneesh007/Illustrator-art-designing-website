document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Fabric.js Vector Engine ---
    const canvas = new fabric.Canvas('main-canvas', {
        backgroundColor: '#111',
        selection: true,
        preserveObjectStacking: true
    });

    const brushSize = document.getElementById('brush-size');
    const colorPicker = document.getElementById('color-picker');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const clearBtn = document.getElementById('clear-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const toFrontBtn = document.getElementById('to-front');
    const toBackBtn = document.getElementById('to-back');
    const toolStatus = document.getElementById('tool-status');
    const saveStatus = document.getElementById('save-status');

    let currentTool = 'select';

    // --- Responsive Canvas ---
    function resizeCanvas() {
        const container = document.querySelector('.studio-canvas-wrapper');
        const rect = container.getBoundingClientRect();
        
        canvas.setDimensions({
            width: rect.width - 60,
            height: rect.height - 60
        });
        
        canvas.setBackgroundColor('#151515', canvas.renderAll.bind(canvas));
    }
    
    // Safety delay to ensure container is rendered
    setTimeout(() => {
        resizeCanvas();
        // Add a placeholder object to test visibility
        addShape('rect');
        canvas.renderAll();
    }, 500);

    window.addEventListener('resize', resizeCanvas);

    // --- Auto-Save Loading ---
    const savedJSON = localStorage.getItem('calqube_pro_save');
    if (savedJSON) {
        canvas.loadFromJSON(savedJSON, canvas.renderAll.bind(canvas));
    }

    // --- Tool Selection Logic ---
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            updateToolMode();
        });
    });

    function updateToolMode() {
        canvas.isDrawingMode = false;
        canvas.selection = false;
        toolStatus.innerText = `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Mode`;

        switch(currentTool) {
            case 'select':
                canvas.selection = true;
                canvas.forEachObject(obj => obj.selectable = obj.evented = true);
                break;
            case 'pen':
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.width = parseInt(brushSize.value) || 5;
                canvas.freeDrawingBrush.color = colorPicker.value;
                canvas.freeDrawingBrush.shadow = new fabric.Shadow({
                    blur: 10,
                    offsetX: 0,
                    offsetY: 0,
                    affectStroke: true,
                    color: colorPicker.value
                });
                break;
            case 'eraser':
                // Eraser in Vector is often implemented as a white/bg-colored brush 
                // or by deleting selected objects. For UX, we'll delete selected.
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length) {
                    canvas.discardActiveObject();
                    canvas.remove(...activeObjects);
                }
                break;
            case 'circle':
                addShape('circle');
                break;
            case 'rect':
                addShape('rect');
                break;
        }
    }

    function addShape(type) {
        let shape;
        const opts = {
            left: 100,
            top: 100,
            fill: colorPicker.value,
            width: 100,
            height: 100,
            strokeWidth: parseInt(brushSize.value),
            stroke: '#fff'
        };

        if (type === 'circle') {
            shape = new fabric.Circle({ ...opts, radius: 50 });
        } else if (type === 'rect') {
            shape = new fabric.Rect(opts);
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
    }

    // --- Property Sync ---
    colorPicker.addEventListener('input', () => {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            activeObj.set('fill', colorPicker.value);
            canvas.renderAll();
        }
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush.color = colorPicker.value;
            if (canvas.freeDrawingBrush.shadow) {
                canvas.freeDrawingBrush.shadow.color = colorPicker.value;
            }
        }
    });

    brushSize.addEventListener('input', () => {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            activeObj.set('strokeWidth', parseInt(brushSize.value));
            canvas.renderAll();
        }
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush.width = parseInt(brushSize.value);
        }
    });

    // --- Layering ---
    toFrontBtn.addEventListener('click', () => {
        const activeObj = canvas.getActiveObject();
        if (activeObj) activeObj.bringToFront();
    });

    toBackBtn.addEventListener('click', () => {
        const activeObj = canvas.getActiveObject();
        if (activeObj) activeObj.sendToBack();
    });

    // --- Actions ---
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all vector objects?')) {
            canvas.clear();
            canvas.setBackgroundColor('#151515', canvas.renderAll.bind(canvas));
            localStorage.removeItem('calqube_pro_save');
            saveStatus.innerText = 'Canvas Cleared';
            setTimeout(() => { saveStatus.innerText = 'Saved'; }, 2000);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1
        });
        const link = document.createElement('a');
        link.download = `calqube-vector-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    });

    // --- Auto-Save ---
    canvas.on('object:modified', autoSave);
    canvas.on('object:added', autoSave);
    canvas.on('object:removed', autoSave);

    function autoSave() {
        saveStatus.innerText = 'Syncing...';
        localStorage.setItem('calqube_pro_save', JSON.stringify(canvas.toJSON()));
        setTimeout(() => {
            saveStatus.innerText = 'Saved';
        }, 1000);
    }
});
