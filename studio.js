document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Pro Extreme Engine ---
    const canvas = new fabric.Canvas('main-canvas', {
        backgroundColor: '#111',
        selection: true,
        preserveObjectStacking: true
    });

    // --- UI Elements ---
    const toolBtns = document.querySelectorAll('.tool-btn');
    const layersList = document.getElementById('layers-list');
    const toolStatus = document.getElementById('tool-status');
    const saveStatus = document.getElementById('save-status');

    // --- Property Inputs ---
    const props = {
        x: document.getElementById('prop-x'),
        y: document.getElementById('prop-y'),
        w: document.getElementById('prop-w'),
        h: document.getElementById('prop-h'),
        fill: document.getElementById('prop-fill'),
        stroke: document.getElementById('prop-stroke'),
        strokeWidth: document.getElementById('prop-stroke-width'),
        opacity: document.getElementById('prop-opacity')
    };

    let currentTool = 'select';

    // --- Responsive Canvas ---
    function resizeCanvas() {
        const container = document.querySelector('.studio-canvas-wrapper');
        const rect = container.getBoundingClientRect();
        canvas.setDimensions({ width: rect.width, height: rect.height });
        canvas.setBackgroundColor('#111', canvas.renderAll.bind(canvas));
    }
    setTimeout(resizeCanvas, 500);
    window.addEventListener('resize', resizeCanvas);

    // --- Layers Management ---
    function updateLayers() {
        layersList.innerHTML = '';
        canvas.getObjects().reverse().forEach((obj, index) => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            if (canvas.getActiveObject() === obj) item.classList.add('active');
            item.innerHTML = `<span>${obj.type.toUpperCase()}</span>`;
            item.onclick = () => {
                canvas.setActiveObject(obj);
                canvas.renderAll();
            };
            layersList.appendChild(item);
        });
    }

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('selection:created', (e) => { updateLayers(); updateProperties(e.selected[0]); });
    canvas.on('selection:updated', (e) => { updateLayers(); updateProperties(e.selected[0]); });
    canvas.on('selection:cleared', () => { updateLayers(); resetProperties(); });
    canvas.on('object:modified', (e) => { updateProperties(e.target); autoSave(); });

    // --- Property Engine ---
    function updateProperties(obj) {
        if (!obj) return;
        props.x.value = Math.round(obj.left);
        props.y.value = Math.round(obj.top);
        props.w.value = Math.round(obj.width * obj.scaleX);
        props.h.value = Math.round(obj.height * obj.scaleY);
        props.fill.value = obj.fill || '#ffffff';
        props.stroke.value = obj.stroke || '#000000';
        props.strokeWidth.value = obj.strokeWidth || 0;
        props.opacity.value = obj.opacity * 100;
    }

    function resetProperties() {
        Object.values(props).forEach(input => input.value = '');
    }

    // Bidirectional Binding
    Object.keys(props).forEach(key => {
        props[key].oninput = () => {
            const obj = canvas.getActiveObject();
            const val = props[key].value;

            // Update Drawing Brush in real-time
            if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
                if (key === 'fill' || key === 'stroke') canvas.freeDrawingBrush.color = val;
                if (key === 'strokeWidth') canvas.freeDrawingBrush.width = parseFloat(val) || 1;
            }

            if (!obj) return;
            switch(key) {
                case 'x': obj.set('left', parseFloat(val)); break;
                case 'y': obj.set('top', parseFloat(val)); break;
                case 'w': obj.set('width', parseFloat(val) / obj.scaleX); break;
                case 'h': obj.set('height', parseFloat(val) / obj.scaleY); break;
                case 'fill': obj.set('fill', val); break;
                case 'stroke': obj.set('stroke', val); break;
                case 'strokeWidth': obj.set('strokeWidth', parseFloat(val)); break;
                case 'opacity': obj.set('opacity', parseFloat(val) / 100); break;
            }
            canvas.renderAll();
            autoSave();
        };
    });

    // --- Tool logic ---
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
        toolStatus.innerText = `${currentTool.toUpperCase()} MODE`;
        if (currentTool === 'pen') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = 5;
            canvas.freeDrawingBrush.color = props.fill.value || '#3b82f6';
        } else if (currentTool === 'eraser') {
            const active = canvas.getActiveObjects();
            if (active.length) {
                canvas.remove(...active);
                canvas.discardActiveObject().renderAll();
                autoSave();
            }
        } else if (['rect', 'circle', 'text', 'curve'].includes(currentTool)) {
            addObj(currentTool);
        }
    }

    function addObj(type) {
        let obj;
        const base = { left: 100, top: 100, fill: props.fill.value || '#3b82f6' };
        if (type === 'rect') obj = new fabric.Rect({ ...base, width: 100, height: 100 });
        if (type === 'circle') obj = new fabric.Circle({ ...base, radius: 50 });
        if (type === 'text') obj = new fabric.IText('PRO EXTREME', { ...base, fontFamily: 'Outfit' });
        if (type === 'curve') {
            obj = new fabric.Path('M 0 0 Q 50 100 100 0', { 
                ...base, 
                fill: '', 
                stroke: props.fill.value || '#3b82f6', 
                strokeWidth: 4 
            });
        }
        
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
    }

    // --- Image Attachment Engine ---
    const addImageBtn = document.getElementById('add-image-btn');
    const imageInput = document.getElementById('image-input');

    if (addImageBtn) {
        addImageBtn.onclick = () => imageInput.click();
    }

    if (imageInput) {
        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    img.scaleToWidth(300);
                    canvas.add(img);
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                    autoSave();
                });
            };
            reader.readAsDataURL(file);
        };
    }

    // --- Alignment Engine ---
    window.align = (dir) => {
        const obj = canvas.getActiveObject();
        if (!obj) return;
        const cw = canvas.width;
        if (dir === 'left') obj.set('left', 0);
        if (dir === 'center') obj.set('left', (cw / 2) - (obj.width * obj.scaleX / 2));
        if (dir === 'right') obj.set('left', cw - (obj.width * obj.scaleX));
        canvas.renderAll();
        autoSave();
    };

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.onclick = () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        const bg = isLight ? '#ffffff' : '#111111';
        canvas.setBackgroundColor(bg, canvas.renderAll.bind(canvas));
        localStorage.setItem('calqube_theme', isLight ? 'light' : 'dark');
    };
    if (localStorage.getItem('calqube_theme') === 'light') {
        document.body.classList.add('light-mode');
        // Delay to ensure canvas is ready
        setTimeout(() => canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas)), 600);
    }
    document.getElementById('to-front').onclick = () => canvas.getActiveObject()?.bringToFront();
    document.getElementById('clear-canvas').onclick = () => { canvas.clear(); canvas.setBackgroundColor('#111', canvas.renderAll.bind(canvas)); localStorage.removeItem('calqube_pro_save'); };
    document.getElementById('download-btn').onclick = () => {
        const link = document.createElement('a');
        link.download = 'calqube-extreme.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    // --- Auto-Save ---
    function autoSave() {
        saveStatus.innerText = 'Syncing...';
        localStorage.setItem('calqube_pro_save', JSON.stringify(canvas.toJSON()));
        setTimeout(() => saveStatus.innerText = 'Saved', 1000);
    }
    const saved = localStorage.getItem('calqube_pro_save');
    if (saved) canvas.loadFromJSON(saved, canvas.renderAll.bind(canvas));
});
