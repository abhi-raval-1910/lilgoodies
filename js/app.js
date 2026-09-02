// ========== DIGITAL CARE PACKAGE - MAIN APP ==========

// Package data store
let packageData = {
    to: '',
    from: '',
    items: [],
    amount: 899,
    createdAt: null
};

let adminSettings = {
    username: 'admin',
    password: 'lilgoodies',
    creatorName: 'with love',
    packagePrice: 899,
    upiId: 'lilgoodies@upi',
    note: 'Family gift box campaign',
    packageLog: []
};

// Icon map for cart display (fallback emoji, used only if image fails)
const iconMap = {
    note: '🖨️',
    photo: '📷',
    song: '💿',
    video: '🎥',
    gift: '🎀',
    voice: '🎙️',
    drawing: '✏️',
    location: '🗺️',
    coupon: '🎟️',
    news: '📰',
    rakhi: '🎀'
};

// Real illustration icons that match the item-selection grid
const itemIconSrc = {
    note: 'note.png',
    photo: 'photo.png',
    song: 'song.png',
    video: 'video.png',
    gift: 'gift.png',
    voice: 'voice.png',
    drawing: 'drawing.png',
    location: 'map.png',
    coupon: 'coupon.png',
    news: 'news.png',
    rakhi: 'rakhi.png'
};

function iconMarkup(type, size) {
    const src = itemIconSrc[type];
    const dimension = size || 28;
    if (src) {
        return `<img class="type-icon" src="${src}" alt="" aria-hidden="true" style="width:${dimension}px;height:${dimension}px;object-fit:contain;">`;
    }
    return `<span class="type-icon-emoji">${iconMap[type] || '📦'}</span>`;
}

// ========== FLOW STEP INDICATOR ==========
function updateFlowSteps(stage) {
    const steps = document.querySelectorAll('.flow-step');
    if (!steps.length) return;
    // stage: 1 = composing, 2 = has items / ready to preview, 3 = package sent
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.toggle('is-done', stepNum < stage);
        step.classList.toggle('is-active', stepNum === stage);
    });
}

// ========== TOAST NOTIFICATION ==========
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// ========== MODAL MANAGEMENT ==========
function openModal(type) {
    const modalId = type + 'Modal';
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize drawing canvas if needed
        if (type === 'drawing') {
            initDrawingCanvas();
        }
        
        // Initialize waveform canvas
        if (type === 'voice') {
            drawWaveform();
        }
    }
}

function openCheckoutModal() {
    const hasItems = packageData.items && packageData.items.length > 0;
    if (!hasItems) {
        showToast('Add at least one thing before checkout');
        return;
    }
    packageData.amount = adminSettings.packagePrice || 899;
    const couponInput = document.getElementById('couponCode');
    const couponFeedback = document.getElementById('couponFeedback');
    if (couponInput) {
        couponInput.value = '';
        couponInput.dataset.valid = 'false';
    }
    if (couponFeedback) couponFeedback.style.display = 'none';
    const payButton = document.getElementById('payButton');
    if (payButton) payButton.textContent = `Pay ₹${packageData.amount}`;
    const paymentAmount = document.getElementById('paymentAmount');
    if (paymentAmount) paymentAmount.textContent = `₹${packageData.amount}`;
    const paymentMethods = document.getElementById('paymentMethods');
    if (paymentMethods) paymentMethods.style.display = 'flex';
    document.getElementById('paymentForm').style.display = 'block';
    renderUpiQrCode();
    document.getElementById('paymentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderUpiQrCode() {
    const upiId = adminSettings.upiId || 'lilgoodies@upi';
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('LilGoodies')}&am=${encodeURIComponent(String(packageData.amount || adminSettings.packagePrice || 899))}&cu=INR&tn=${encodeURIComponent('Digital Care Package')}`;
    const qrContainer = document.getElementById('upiQrCode');
    const qrPanel = document.getElementById('upiQrPanel');
    const paymentForm = document.getElementById('paymentForm');
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';

    if (paymentMethod === 'upi') {
        qrPanel.style.display = 'block';
        paymentForm.style.display = 'none';
    } else {
        qrPanel.style.display = 'none';
        paymentForm.style.display = 'block';
    }

    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    if (window.qrcode) {
        const qr = window.qrcode(0, 'L');
        qr.addData(upiString);
        qr.make();
        qrContainer.innerHTML = qr.createImgTag(8, 12, 'upi-payment-qr');
        return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiString)}`;
    qrContainer.innerHTML = `<img src="${qrUrl}" alt="UPI payment QR code" />`;
}

function syncPaymentMethodDisplay() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    const qrPanel = document.getElementById('upiQrPanel');
    const paymentForm = document.getElementById('paymentForm');

    if (paymentMethod === 'upi') {
        qrPanel.style.display = 'block';
        paymentForm.style.display = 'none';
        renderUpiQrCode();
    } else {
        qrPanel.style.display = 'none';
        paymentForm.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ========== ADD ITEMS ==========
function addItem(type) {
    let itemData = { type, id: Date.now() };
    
    switch(type) {
        case 'note': {
            const text = document.getElementById('noteText').value.trim();
            if (!text) { showToast('Please write a note'); return; }
            itemData.text = text;
            itemData.description = text.substring(0, 40) + (text.length > 40 ? '...' : '');
            document.getElementById('noteText').value = '';
            break;
        }
        case 'photo': {
            const preview = document.getElementById('photoPreview');
            if (!preview.src || preview.src === window.location.href) { 
                showToast('Please upload a photo'); return; 
            }
            itemData.src = preview.src;
            itemData.caption = document.getElementById('photoCaption').value.trim();
            itemData.description = itemData.caption || 'Photo';
            document.getElementById('photoCaption').value = '';
            document.getElementById('photoPreviewContainer').style.display = 'none';
            document.getElementById('photoFile').value = '';
            break;
        }
        case 'song': {
            const link = document.getElementById('songLink').value.trim();
            if (!link) { showToast('Please add a song link'); return; }
            itemData.link = link;
            itemData.title = document.getElementById('songTitle').value.trim();
            itemData.description = itemData.title || link.substring(0, 40) + '...';
            document.getElementById('songLink').value = '';
            document.getElementById('songTitle').value = '';
            break;
        }
        case 'video': {
            const link = document.getElementById('videoLink').value.trim();
            if (!link) { showToast('Please add a video link'); return; }
            itemData.link = link;
            itemData.title = document.getElementById('videoTitle').value.trim();
            itemData.description = itemData.title || link.substring(0, 40) + '...';
            document.getElementById('videoLink').value = '';
            document.getElementById('videoTitle').value = '';
            break;
        }
        case 'gift': {
            const link = document.getElementById('giftLink').value.trim();
            if (!link) { showToast('Please add a gift link'); return; }
            itemData.link = link;
            itemData.desc = document.getElementById('giftDesc').value.trim();
            itemData.description = itemData.desc || 'Gift';
            document.getElementById('giftLink').value = '';
            document.getElementById('giftDesc').value = '';
            break;
        }
        case 'voice': {
            if (!voiceBlob && !audioUploadSource) { showToast('Please record or upload a voice memo'); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                itemData.audioData = reader.result;
                itemData.description = 'voice memo';
                itemData.fileName = document.getElementById('audioFile')?.files?.[0]?.name || 'voice memo';
                packageData.items.push(itemData);
                updateCart();
                closeModal('voiceModal');
                showToast('Voice memo added! 🎤');
                resetVoiceInput();
            };
            if (voiceBlob) {
                reader.readAsDataURL(voiceBlob);
            } else if (audioUploadSource) {
                reader.readAsDataURL(new Blob([audioUploadSource], { type: 'audio/mpeg' }));
            }
            return; // Early return since we handle async
        }
        case 'drawing': {
            const canvas = document.getElementById('drawingCanvas');
            const dataUrl = canvas.toDataURL('image/png');
            // Check if canvas is empty
            const ctx = canvas.getContext('2d');
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let isEmpty = true;
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] !== 0) { // Check alpha channel only on non-white
                    // Actually check if it's not the white background
                    if (pixels[i-3] !== 255 || pixels[i-2] !== 255 || pixels[i-1] !== 255) {
                        isEmpty = false;
                        break;
                    }
                }
            }
            itemData.src = dataUrl;
            itemData.description = 'hand drawing';
            clearCanvas();
            break;
        }
        case 'location': {
            const name = document.getElementById('locationName').value.trim();
            if (!name) { showToast('Please add a place name'); return; }
            itemData.name = name;
            itemData.address = document.getElementById('locationAddress').value.trim();
            itemData.note = document.getElementById('locationNote').value.trim();
            itemData.description = name;
            document.getElementById('locationName').value = '';
            document.getElementById('locationAddress').value = '';
            document.getElementById('locationNote').value = '';
            break;
        }
        case 'coupon': {
            const title = document.getElementById('couponTitle').value.trim();
            if (!title) { showToast('Please add a coupon title'); return; }
            itemData.title = title;
            itemData.desc = document.getElementById('couponDesc').value.trim();
            itemData.description = title;
            document.getElementById('couponTitle').value = '';
            document.getElementById('couponDesc').value = '';
            break;
        }
        case 'news': {
            const headline = document.getElementById('newsHeadline').value.trim();
            if (!headline) { showToast('Please add a headline'); return; }
            itemData.headline = headline;
            itemData.story = document.getElementById('newsStory').value.trim();
            itemData.description = headline;
            document.getElementById('newsHeadline').value = '';
            document.getElementById('newsStory').value = '';
            break;
        }
        case 'rakhi': {
            const message = document.getElementById('rakhiMessage').value.trim();
            if (!message) { showToast('Please write a message for your sister'); return; }
            itemData.message = message;
            itemData.description = 'Virtual Rakhi';
            document.getElementById('rakhiMessage').value = '';
            break;
        }
    }
    
    packageData.items.push(itemData);
    updateCart();
    closeModal(type + 'Modal');
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} added to package! ✨`);
}

// ========== REMOVE ITEM ==========
function removeItem(id) {
    packageData.items = packageData.items.filter(item => item.id !== id);
    updateCart();
    showToast('Item removed');
}

// ========== UPDATE CART ==========
function updateCart() {
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');
    
    if (packageData.items.length === 0) {
        cartSection.style.display = 'none';
        return;
    }
    
    cartSection.style.display = 'block';
    cartItems.innerHTML = '';
    
    packageData.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span class="cart-item-icon">${iconMarkup(item.type, 30)}</span>
            <div class="cart-item-info">
                <div class="cart-item-type">${item.type}</div>
                <div class="cart-item-desc">${item.description || ''}</div>
            </div>
            <button class="btn-remove" onclick="removeItem(${item.id})" aria-label="Remove ${item.type} from package">remove</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Save to localStorage
    renderLivePreview();
    savePackage();
    updateFlowSteps(packageData.items.length > 0 ? 2 : 1);
    updateMobileStickyBar();
}

function updateMobileStickyBar() {
    const bar = document.getElementById('mobileStickyBar');
    const count = document.getElementById('mobileStickyCount');
    if (!bar || !count) return;
    const n = (packageData.items || []).length;
    bar.classList.toggle('active', n > 0);
    bar.setAttribute('aria-hidden', n > 0 ? 'false' : 'true');
    count.textContent = `${n} ${n === 1 ? 'goodie' : 'goodies'} added`;
}

function renderLivePreview() {
    const panel = document.getElementById('livePreviewPanel');
    const grid = document.getElementById('livePreviewGrid');
    const count = document.getElementById('livePreviewCount');

    if (!panel || !grid || !count) return;

    if (!packageData.items || packageData.items.length === 0) {
        grid.innerHTML = '<div class="empty-preview">No goodies yet</div>';
        count.textContent = '0 goodies';
        panel.classList.remove('active');
        return;
    }

    panel.classList.add('active');
    count.textContent = `${packageData.items.length} ${packageData.items.length === 1 ? 'goodie' : 'goodies'}`;
    grid.innerHTML = packageData.items.map((item) => {
        let previewMarkup = `<div class="preview-thumb preview-icon">${iconMarkup(item.type, 34)}</div>`;

        if (item.type === 'photo' && item.src) {
            previewMarkup = `<img class="preview-thumb preview-image" src="${item.src}" alt="${item.description || 'Photo'}">`;
        }

        if (item.type === 'drawing' && item.src) {
            previewMarkup = `<img class="preview-thumb preview-image" src="${item.src}" alt="Drawing">`;
        }

        if ((item.type === 'note' || item.type === 'coupon' || item.type === 'news' || item.type === 'location') && item.description) {
            previewMarkup = `<div class="preview-thumb preview-text">${item.description.slice(0, 18)}</div>`;
        }

        return `
            <div class="live-preview-item" title="${item.description || item.type}">
                ${previewMarkup}
                <span>${(item.type || 'item').charAt(0).toUpperCase() + (item.type || 'item').slice(1)}</span>
            </div>
        `;
    }).join('');
}

// ========== PHOTO UPLOAD ==========
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photoPreview');
        preview.src = e.target.result;
        document.getElementById('photoPreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ========== VOICE RECORDING ==========
let mediaRecorder = null;
let voiceChunks = [];
let voiceBlob = null;
let isRecording = false;
let audioUploadSource = null;

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        voiceChunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            voiceChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            voiceBlob = new Blob(voiceChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(voiceBlob);
            const playback = document.getElementById('voicePlayback');
            playback.src = audioUrl;
            playback.style.display = 'block';
            document.getElementById('voicePreviewHint').style.display = 'block';
            document.getElementById('recordingStatus').textContent = 'Recording ready - preview it before adding';
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        document.getElementById('recordBtn').textContent = 'Stop';
        document.getElementById('recordBtn').classList.add('recording');
        document.getElementById('recordingStatus').textContent = 'Recording...';
        animateWaveform();
    } catch (err) {
        showToast('Microphone access denied');
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    isRecording = false;
    document.getElementById('recordBtn').textContent = 'Record';
    document.getElementById('recordBtn').classList.remove('recording');
}

function handleAudioUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        showToast('Please upload a valid audio file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const audioUrl = e.target.result;
        voiceBlob = file;
        audioUploadSource = audioUrl;

        const playback = document.getElementById('voicePlayback');
        playback.src = audioUrl;
        playback.style.display = 'block';
        document.getElementById('voicePreviewHint').style.display = 'block';
        document.getElementById('recordingStatus').textContent = `Uploaded: ${file.name}`;
    };
    reader.readAsDataURL(file);
}

// ========== WAVEFORM VISUALIZATION ==========
let waveformAnimation = null;

function drawWaveform() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 60 * 2;
    ctx.scale(2, 2);
    
    const w = canvas.offsetWidth;
    const h = 60;
    
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#d4a08a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    
    for (let x = 0; x < w; x += 10) {
        ctx.lineTo(x, h / 2);
    }
    
    ctx.stroke();
}

function animateWaveform() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth;
    const h = 60;
    let offset = 0;
    
    function draw() {
        if (!isRecording) return;
        
        ctx.clearRect(0, 0, w * 2, h * 2);
        ctx.save();
        ctx.scale(2, 2);
        ctx.strokeStyle = '#a0422a';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        
        for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin((x + offset) * 0.05) * 15 * Math.random();
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.restore();
        offset += 2;
        waveformAnimation = requestAnimationFrame(draw);
    }
    
    draw();
}

// ========== DRAWING CANVAS ==========
let drawingCtx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function initDrawingCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;
    
    drawingCtx = canvas.getContext('2d');
    
    // Fill white background
    drawingCtx.fillStyle = 'white';
    drawingCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Remove old listeners to prevent duplicates
    canvas.removeEventListener('mousedown', startDraw);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDraw);
    canvas.removeEventListener('mouseleave', stopDraw);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', stopDraw);
    
    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
}

function getCanvasCoords(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDraw(e) {
    isDrawing = true;
    const coords = getCanvasCoords(e.target, e);
    lastX = coords.x;
    lastY = coords.y;
}

function draw(e) {
    if (!isDrawing) return;
    
    const canvas = e.target;
    const coords = getCanvasCoords(canvas, e);
    
    drawingCtx.strokeStyle = document.getElementById('drawColor').value;
    drawingCtx.lineWidth = document.getElementById('drawSize').value;
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    drawingCtx.lineTo(coords.x, coords.y);
    drawingCtx.stroke();
    
    lastX = coords.x;
    lastY = coords.y;
}

function stopDraw() {
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * scaleX;
    lastY = (touch.clientY - rect.top) * scaleY;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    drawingCtx.strokeStyle = document.getElementById('drawColor').value;
    drawingCtx.lineWidth = document.getElementById('drawSize').value;
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    
    lastX = x;
    lastY = y;
}

function clearCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas && drawingCtx) {
        drawingCtx.fillStyle = 'white';
        drawingCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ========== SAVE & LOAD PACKAGE ==========
function savePackage() {
    packageData.to = document.getElementById('toField').value;
    packageData.from = document.getElementById('fromField').value;
    packageData.amount = Number.isFinite(Number(packageData.amount)) ? Number(packageData.amount) : (adminSettings.packagePrice || 899);
    packageData.createdAt = packageData.createdAt || new Date().toISOString();
    
    try {
        localStorage.setItem('carePackage', JSON.stringify(packageData));
    } catch(e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadPackage() {
    try {
        const saved = localStorage.getItem('carePackage');
        if (saved) {
            packageData = JSON.parse(saved);
            packageData.items = packageData.items || [];
            packageData.amount = packageData.amount || adminSettings.packagePrice || 899;
            document.getElementById('toField').value = packageData.to || '';
            document.getElementById('fromField').value = packageData.from || '';
            updateCart();
        }
    } catch(e) {
        console.warn('Could not load from localStorage:', e);
    }
}

function loadAdminSettings() {
    try {
        const saved = localStorage.getItem('lilGoodiesAdmin');
        if (saved) {
            adminSettings = { ...adminSettings, ...JSON.parse(saved) };
        }
        if (!adminSettings.packageLog) adminSettings.packageLog = [];
        adminSettings.packagePrice = Number(adminSettings.packagePrice || 899);
        adminSettings.creatorName = adminSettings.creatorName || 'with love';
        adminSettings.upiId = adminSettings.upiId || 'lilgoodies@upi';
        packageData.amount = adminSettings.packagePrice;
        const creatorBadge = document.getElementById('creatorBadge');
        if (creatorBadge) creatorBadge.textContent = adminSettings.creatorName;
    } catch (e) {
        console.warn('Could not load admin settings:', e);
    }
}

function saveAdminSettingsToStorage() {
    try {
        localStorage.setItem('lilGoodiesAdmin', JSON.stringify(adminSettings));
    } catch (e) {
        console.warn('Could not save admin settings:', e);
    }
}

function recordPackageUsage() {
    const entry = {
        to: (document.getElementById('toField')?.value || packageData.to || 'friend').trim() || 'friend',
        from: (document.getElementById('fromField')?.value || packageData.from || 'someone').trim() || 'someone',
        createdAt: new Date().toISOString(),
        itemCount: (packageData.items || []).length,
        amount: Number(adminSettings.packagePrice || 899)
    };

    adminSettings.packageLog = Array.isArray(adminSettings.packageLog) ? adminSettings.packageLog : [];
    adminSettings.packageLog.unshift(entry);
    adminSettings.packageLog = adminSettings.packageLog.slice(0, 20);
    saveAdminSettingsToStorage();
    renderAdminDashboard();
}

function resetVoiceInput() {
    voiceBlob = null;
    audioUploadSource = null;
    const fileInput = document.getElementById('audioFile');
    if (fileInput) fileInput.value = '';
    const playback = document.getElementById('voicePlayback');
    if (playback) {
        playback.pause();
        playback.src = '';
        playback.style.display = 'none';
    }
    const previewHint = document.getElementById('voicePreviewHint');
    if (previewHint) previewHint.style.display = 'none';
    const status = document.getElementById('recordingStatus');
    if (status) status.textContent = 'Not recorded yet';
}

function generatePackageId() {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

function openAdminLogin() {
    document.getElementById('adminLoginModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function loginAdmin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (username === adminSettings.username && password === adminSettings.password) {
        closeModal('adminLoginModal');
        renderAdminDashboard();
        document.getElementById('adminDashboardModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        showToast('Invalid admin credentials');
    }
}

function saveAdminSettings() {
    const creatorName = document.getElementById('adminCreatorName').value.trim() || 'with love';
    const price = Number(document.getElementById('adminPrice').value || 899);
    const upiId = document.getElementById('adminUpiId').value.trim() || 'lilgoodies@upi';
    const note = document.getElementById('adminNote').value.trim() || 'Family gift box campaign';

    adminSettings.creatorName = creatorName;
    adminSettings.packagePrice = price;
    adminSettings.upiId = upiId;
    adminSettings.note = note;
    saveAdminSettingsToStorage();

    const creatorBadge = document.getElementById('creatorBadge');
    if (creatorBadge) creatorBadge.textContent = creatorName;

    packageData.amount = price;
    document.getElementById('paymentModal')?.querySelector('.payment-summary strong') && (document.getElementById('paymentModal').querySelector('.payment-summary strong').textContent = `₹${price}`);
    renderUpiQrCode();
    renderAdminDashboard();
    showToast('Admin settings saved');
}

function renderAdminDashboard() {
    const totalPackages = adminSettings.packageLog.length;
    const revenue = adminSettings.packageLog.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const avgItems = totalPackages ? (adminSettings.packageLog.reduce((sum, entry) => sum + Number(entry.itemCount || 0), 0) / totalPackages).toFixed(1) : '0';
    const creatorName = adminSettings.creatorName || 'with love';

    document.getElementById('statTotalPackages').textContent = totalPackages;
    document.getElementById('statRevenue').textContent = `₹${revenue}`;
    document.getElementById('statAvgItems').textContent = avgItems;
    document.getElementById('statCreatorCount').textContent = creatorName ? '1' : '0';

    document.getElementById('adminCreatorName').value = creatorName;
    document.getElementById('adminPrice').value = adminSettings.packagePrice || 899;
    document.getElementById('adminUpiId').value = adminSettings.upiId || 'lilgoodies@upi';
    document.getElementById('adminNote').value = adminSettings.note || '';

    const tbody = document.getElementById('recentPackagesBody');
    if (!tbody) return;

    if (!adminSettings.packageLog.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No package activity yet</td></tr>';
        return;
    }

    tbody.innerHTML = adminSettings.packageLog.slice(0, 8).map((entry) => {
        const date = new Date(entry.createdAt).toLocaleDateString();
        return `
            <tr>
                <td>${entry.to}</td>
                <td>${entry.from}</td>
                <td>${date}</td>
                <td>${entry.itemCount}</td>
            </tr>
        `;
    }).join('');
}

async function generatePackageLink(status = 'paid', couponCode = '', payment = null) {
    packageData.to = document.getElementById('toField').value || 'friend';
    packageData.from = document.getElementById('fromField').value || 'someone';
    if (!packageData.items || packageData.items.length === 0) {
        showToast('Add at least one item to your package!');
        return;
    }

    savePackage();

    try {
        const response = await fetch('/api/packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...packageData, status, couponCode, payment })
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || `Package service returned ${response.status}`);
        }
        const remotePackage = await response.json();
        const previewUrl = new URL(remotePackage.shareUrl || remotePackage.url, window.location.href);
        document.getElementById('generatedLink').value = previewUrl.href;
        openModalById('linkModal');
        updateFlowSteps(4);
        return;
    } catch (error) {
<<<<<<< HEAD
        console.error('Could not store package in Supabase:', error);
        showToast('Could not create the shared link. Check the live API setup and try again.');
=======
        console.warn('Remote package storage unavailable; using local preview:', error);
        if (!isLocalDevelopment()) {
            showToast('Could not save package. Please check database setup and try again.');
            return;
        }
        showToast('Package service unavailable; creating a local preview link for local testing.');
    }

    try {
        const packageId = generatePackageId();
        localStorage.setItem(packageId, JSON.stringify(packageData));
        const previewUrl = new URL('preview.html', window.location.href);
        previewUrl.searchParams.set('id', packageId);
        document.getElementById('generatedLink').value = previewUrl.href;
        openModalById('linkModal');
    } catch (e) {
        console.warn('Storage full, using fallback package key');
        const fallbackId = 'carePackage';
        localStorage.setItem(fallbackId, JSON.stringify(packageData));
        const previewUrl = new URL('preview.html', window.location.href);
        previewUrl.searchParams.set('id', fallbackId);
        document.getElementById('generatedLink').value = previewUrl.href;
        openModalById('linkModal');
>>>>>>> upstream/main
    }

    function isLocalDevelopment() {
        const hostname = window.location.hostname;
        return window.location.protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
    }
}

// ========== GENERATE LINK ==========
function generateLink() {
    openCheckoutModal();
}

async function applyCoupon() {
    const input = document.getElementById('couponCode');
    const feedback = document.getElementById('couponFeedback');
    const code = input?.value.trim().toUpperCase();
    if (!code) return;

    if (code === 'LOVE$100') {
        packageData.amount = 0;
        feedback.textContent = 'Coupon applied. Your package is free.';
        feedback.style.color = 'var(--postal-red)';
        feedback.style.display = 'block';
        document.getElementById('payButton').textContent = 'Generate free package';
        document.getElementById('paymentAmount').textContent = 'FREE';
        document.getElementById('paymentMethods').style.display = 'none';
        document.getElementById('paymentForm').style.display = 'none';
        document.getElementById('upiQrPanel').style.display = 'none';
        input.dataset.valid = 'true';
        return;
    }

    try {
        const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const result = response.headers.get('content-type')?.includes('application/json')
            ? await response.json()
            : {};
        if (!response.ok || !result.valid) throw new Error(result.error || 'Invalid coupon');
        packageData.amount = 0;
        feedback.textContent = 'Coupon applied. Your package is free.';
        feedback.style.color = 'var(--postal-red)';
        feedback.style.display = 'block';
        document.getElementById('payButton').textContent = 'Generate free package';
        document.getElementById('paymentAmount').textContent = 'FREE';
        document.getElementById('paymentMethods').style.display = 'none';
        document.getElementById('paymentForm').style.display = 'none';
        document.getElementById('upiQrPanel').style.display = 'none';
        input.dataset.valid = 'true';
    } catch (error) {
        input.dataset.valid = 'false';
        feedback.textContent = error.message;
        feedback.style.color = 'var(--destructive)';
        feedback.style.display = 'block';
        packageData.amount = adminSettings.packagePrice || 899;
        document.getElementById('paymentAmount').textContent = `₹${packageData.amount}`;
        document.getElementById('paymentMethods').style.display = 'flex';
        document.getElementById('paymentForm').style.display = 'block';
        document.getElementById('payButton').textContent = `Pay ₹${packageData.amount}`;
    }
}

async function processPayment() {
    const couponInput = document.getElementById('couponCode');
    if (couponInput?.dataset.valid === 'true') {
        closeModal('paymentModal');
        recordPackageUsage();
        await generatePackageLink('free', couponInput.value.trim().toUpperCase());
        return;
    }
    showToast('Apply the LOVE$100 coupon to generate a free package.');
}

function openModalById(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function copyLink() {
    const input = document.getElementById('generatedLink');
    input.select();
    input.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(input.value);
    } catch(e) {
        document.execCommand('copy');
    }
    
    document.getElementById('copyFeedback').style.display = 'block';
    setTimeout(() => {
        document.getElementById('copyFeedback').style.display = 'none';
    }, 3000);
}

// ========== PREVIEW ==========
function previewPackage() {
    packageData.to = document.getElementById('toField').value || 'friend';
    packageData.from = document.getElementById('fromField').value || 'someone';
    
    if (!packageData.items || packageData.items.length === 0) {
        showToast('Add at least one item to preview!');
        return;
    }
    
    savePackage();
    updateFlowSteps(3);
    const previewUrl = new URL('preview.html', window.location.href);
    previewUrl.searchParams.set('preview', 'true');
    window.location.href = previewUrl.href;
}

// ========== AUTO-SAVE ON INPUT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAdminSettings();
    loadPackage();
    renderLivePreview();
    renderUpiQrCode();
    renderAdminDashboard();
    updateFlowSteps(packageData.items && packageData.items.length > 0 ? 2 : 1);
    updateMobileStickyBar();
    
    const toField = document.getElementById('toField');
    const fromField = document.getElementById('fromField');
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    if (toField) {
        toField.addEventListener('input', () => {
            packageData.to = toField.value;
            savePackage();
        });
    }
    
    if (fromField) {
        fromField.addEventListener('input', () => {
            packageData.from = fromField.value;
            savePackage();
        });
    }

    paymentRadios.forEach((radio) => {
        radio.addEventListener('change', syncPaymentMethodDisplay);
    });
});