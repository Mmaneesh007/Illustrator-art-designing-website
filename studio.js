document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Pro Extreme Engine ---
    const canvas = new fabric.Canvas('main-canvas', {
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        width: 1000,
        height: 800
    });
    canvas.renderAll();

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
                canvas.requestRenderAll();
            };
            layersList.appendChild(item);
        });
        canvas.requestRenderAll();
    }

    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('selection:created', (e) => { updateLayers(); updateProperties(e.selected[0]); });
    canvas.on('selection:updated', (e) => { updateLayers(); updateProperties(e.selected[0]); });
    canvas.on('selection:cleared', () => { updateLayers(); resetProperties(); });
    canvas.on('object:modified', (e) => { updateProperties(e.target); autoSave(); });

    // --- Top Control Palette ---
    const ctrl = {
        fill: document.getElementById('ctrl-fill'),
        stroke: document.getElementById('ctrl-stroke'),
        strokeWidth: document.getElementById('ctrl-stroke-width'),
        font: document.getElementById('ctrl-font'),
        bold: document.getElementById('ctrl-bold'),
        textGroup: document.getElementById('ctrl-text-tools')
    };

    // --- Property Engine ---
    function updateProperties(obj) {
        if (!obj) return;
        
        // Sync Sidebar Props
        props.x.value = Math.round(obj.left);
        props.y.value = Math.round(obj.top);
        props.w.value = Math.round(obj.width * obj.scaleX);
        props.h.value = Math.round(obj.height * obj.scaleY);
        props.fill.value = obj.fill || '#ffffff';
        props.stroke.value = obj.stroke || '#000000';
        props.strokeWidth.value = obj.strokeWidth || 0;
        props.opacity.value = obj.opacity * 100;

        // Sync Top Control Palette
        ctrl.fill.value = obj.fill || '#ffffff';
        ctrl.stroke.value = obj.stroke || '#000000';
        ctrl.strokeWidth.value = obj.strokeWidth || 0;
        
        if (obj.type === 'i-text') {
            ctrl.textGroup.style.display = 'flex';
            ctrl.font.value = obj.fontFamily;
        } else {
            ctrl.textGroup.style.display = 'none';
        }
    }

    function resetProperties() {
        Object.values(props).forEach(input => input.value = '');
        ctrl.textGroup.style.display = 'none';
    }

    // Bidirectional Binding (Global)
    function handleInput(key, val) {
        const obj = canvas.getActiveObject();
        
        // Drawing Brush Sync
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
            case 'fontFamily': obj.set('fontFamily', val); break;
        }
        canvas.renderAll();
        saveState();
    }

    Object.keys(props).forEach(key => {
        props[key].oninput = () => handleInput(key, props[key].value);
    });

    // Top Bar Listeners
    ctrl.fill.oninput = () => { props.fill.value = ctrl.fill.value; handleInput('fill', ctrl.fill.value); };
    ctrl.stroke.oninput = () => { props.stroke.value = ctrl.stroke.value; handleInput('stroke', ctrl.stroke.value); };
    ctrl.strokeWidth.oninput = () => { props.strokeWidth.value = ctrl.strokeWidth.value; handleInput('strokeWidth', ctrl.strokeWidth.value); };
    ctrl.font.onchange = () => handleInput('fontFamily', ctrl.font.value);

    // Typography Bindings
    const propFont = document.getElementById('prop-font');
    propFont.onchange = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fontFamily', propFont.value);
            canvas.renderAll();
            saveState();
        }
    };

    document.getElementById('prop-bold').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
            canvas.renderAll();
            saveState();
        }
    };

    document.getElementById('prop-italic').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
            canvas.renderAll();
            saveState();
        }
    };

    document.getElementById('prop-underline').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('underline', !obj.underline);
            canvas.renderAll();
            saveState();
        }
    };

    // WordArt Effects
    document.getElementById('text-shadow').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 }));
            canvas.renderAll();
            saveState();
        }
    };

    document.getElementById('text-glow').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('shadow', new fabric.Shadow({ color: props.fill.value, blur: 20, offsetX: 0, offsetY: 0 }));
            canvas.renderAll();
            saveState();
        }
    };

    document.getElementById('text-outline').onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set({ stroke: props.fill.value, strokeWidth: 2, fill: 'transparent' });
            canvas.renderAll();
            saveState();
        }
    };

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
        canvas.selection = true;
        canvas.getObjects().forEach(o => o.selectable = o.evented = true);
        
        toolStatus.innerText = `${currentTool.toUpperCase()} MODE`;
        
        if (['pen', 'brush', 'pencil', 'blob'].includes(currentTool)) {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.width = parseFloat(props.strokeWidth.value) || 5;
            canvas.freeDrawingBrush.color = props.fill.value || '#3b82f6';
        } else if (currentTool === 'eraser') {
            const active = canvas.getActiveObjects();
            if (active.length) {
                canvas.remove(...active);
                canvas.discardActiveObject().renderAll();
                saveState();
            }
        } else if (currentTool === 'direct-select') {
            // Allow selecting sub-targets in groups
            canvas.subTargetCheck = true;
        } else if (['rect', 'circle', 'text', 'curve', 'line'].includes(currentTool)) {
            addObj(currentTool);
        }
    }

    function addObj(type) {
        let obj;
        const base = { left: 100, top: 100, fill: props.fill.value || '#3b82f6', stroke: props.stroke.value || '#000', strokeWidth: parseFloat(props.strokeWidth.value) || 0 };
        if (type === 'rect') obj = new fabric.Rect({ ...base, width: 100, height: 100 });
        if (type === 'circle') obj = new fabric.Circle({ ...base, radius: 50 });
        if (type === 'text') obj = new fabric.IText('TYPE TEXT', { ...base, fontFamily: 'Outfit' });
        if (type === 'line') obj = new fabric.Line([50, 50, 200, 200], { ...base, stroke: props.fill.value, strokeWidth: 4 });
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
        saveState();
    }

    function groupObjects() {
        if (!canvas.getActiveObject()) return;
        if (canvas.getActiveObject().type !== 'activeSelection') return;
        canvas.getActiveObject().toGroup();
        canvas.requestRenderAll();
        saveState();
    }

    function ungroupObjects() {
        if (!canvas.getActiveObject()) return;
        if (canvas.getActiveObject().type !== 'group') return;
        canvas.getActiveObject().toActiveSelection();
        canvas.requestRenderAll();
        saveState();
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

    // --- Professional State & Clipboard Engine ---
    let undoStack = [];
    let redoStack = [];
    let _clipboard = null;
    let isStateSaving = false;

    function saveState() {
        if (isStateSaving) return;
        undoStack.push(JSON.stringify(canvas.toJSON()));
        redoStack = []; // Clear redo on new action
        if (undoStack.length > 50) undoStack.shift(); // Limit history
        autoSave();
    }

    function undo() {
        if (undoStack.length <= 1) return;
        isStateSaving = true;
        redoStack.push(undoStack.pop());
        const state = undoStack[undoStack.length - 1];
        canvas.loadFromJSON(state, () => {
            canvas.renderAll();
            isStateSaving = false;
            updateLayers();
        });
    }

    function redo() {
        if (!redoStack.length) return;
        isStateSaving = true;
        const state = redoStack.pop();
        undoStack.push(state);
        canvas.loadFromJSON(state, () => {
            canvas.renderAll();
            isStateSaving = false;
            updateLayers();
        });
    }

    function copy() {
        canvas.getActiveObject()?.clone((cloned) => { _clipboard = cloned; });
    }

    function paste() {
        if (!_clipboard) return;
        _clipboard.clone((cloned) => {
            canvas.discardActiveObject();
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
                evented: true,
            });
            if (cloned.type === 'activeSelection') {
                cloned.canvas = canvas;
                cloned.forEachObject((obj) => canvas.add(obj));
                cloned.setCoords();
            } else {
                canvas.add(cloned);
            }
            _clipboard.top += 20;
            _clipboard.left += 20;
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            saveState();
        });
    }

    // --- Keyboard Shortcuts ---
    window.onkeydown = (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

        const isCtrl = e.ctrlKey || e.metaKey;
        const isAlt = e.altKey;
        const isShift = e.shiftKey;
        const key = e.key.toLowerCase();

        if (isCtrl) {
            switch(key) {
                case 'z': e.preventDefault(); undo(); break;
                case 'y': e.preventDefault(); redo(); break;
                case 'c': e.preventDefault(); copy(); break;
                case 'v': e.preventDefault(); paste(); break;
                case 'x': e.preventDefault(); copy(); canvas.remove(...canvas.getActiveObjects()); saveState(); break;
                case 'g': 
                    e.preventDefault(); 
                    if (isAlt) ungroupObjects(); 
                    else groupObjects(); 
                    break;
            }
        } else {
            // Single Key Tool Shortcuts (Illustrator Standard)
            const toolMap = {
                'v': 'select',
                'a': 'direct-select',
                'p': 'pen',
                't': 'text',
                'm': 'rect',
                'l': 'circle',
                'n': 'pencil',
                'b': isShift ? 'blob' : 'brush',
                'r': 'rotate',
                's': 'scale',
                'e': isShift ? 'eraser' : 'select',
                'h': 'hand',
                'q': 'lasso',
                'y': 'magic-wand',
                '\\': 'line'
            };
            
            if (toolMap[key]) {
                currentTool = toolMap[key];
                document.querySelectorAll('.tool-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tool === currentTool);
                });
                updateToolMode();
                return;
            }

            if (['Delete', 'Backspace'].includes(e.key)) {
                const active = canvas.getActiveObjects();
                if (active.length) {
                    canvas.remove(...active);
                    canvas.discardActiveObject().renderAll();
                    saveState();
                }
            }
        }
    };

    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);
    canvas.on('object:removed', saveState);

    // --- Auto-Save ---
    function autoSave() {
        saveStatus.innerText = 'Syncing...';
        localStorage.setItem('calqube_pro_save', JSON.stringify(canvas.toJSON()));
        setTimeout(() => saveStatus.innerText = 'Saved', 1000);
    }
    const saved = localStorage.getItem('calqube_pro_save');
    if (saved) canvas.loadFromJSON(saved, canvas.renderAll.bind(canvas));
});
