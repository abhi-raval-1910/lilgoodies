// ========== PREVIEW / RECIPIENT PAGE ==========

let previewData = null;
let voiceAudio = null;
let isPlaying = false;

// ========== LOAD PACKAGE DATA ==========
async function loadPreviewData() {
    const params = new URLSearchParams(window.location.search);
    const packageId = params.get('id');
    const isPreview = params.get('preview');
    
    try {
<<<<<<< HEAD
        if (packageId && /^[a-f0-9]{24}$/.test(packageId)) {
            const response = await fetch(`/api/packages/${encodeURIComponent(packageId)}`, {
                cache: 'no-store'
            });
            if (response.ok) {
                previewData = await response.json();
            } else {
                throw new Error(`Package service returned ${response.status}`);
=======
        if (packageId) {
            if (/^[a-z0-9-]{8,120}$/i.test(packageId)) {
                const response = await fetch(`/api/packages/${encodeURIComponent(packageId)}`);
                if (response.ok) {
                    previewData = await response.json();
                }
            }

            if (!previewData) {
                const data = localStorage.getItem(packageId);
                if (data) {
                    previewData = JSON.parse(data);
                }
>>>>>>> upstream/main
            }
        } else if (!packageId && isPreview) {
            const data = localStorage.getItem('carePackage');
            if (data) {
                previewData = JSON.parse(data);
            }
        }
    } catch(e) {
        console.error('Error loading package:', e);
    }

    try {
        const savedAdmin = localStorage.getItem('lilGoodiesAdmin');
        if (savedAdmin) {
            const admin = JSON.parse(savedAdmin);
            const creatorName = document.getElementById('creatorName');
            if (creatorName) {
                creatorName.textContent = admin.creatorName || 'from.collette';
            }
        }
    } catch (e) {
        console.warn('Could not load creator name:', e);
    }
    
    if (!previewData && !packageId) {
        // Demo data
        previewData = {
            to: 'cutie',
            from: 'bestie',
            items: [
                { type: 'note', text: 'Hello! How are you? Just wanted to send you some love and let you know I\'m thinking of you! 💕', description: 'Hello how are you', id: 1 },
                { type: 'drawing', src: createDemoDrawing(), description: 'hand drawing', id: 2 }
            ]
        };
    }

    if (!previewData) {
        document.getElementById('boxTo').textContent = 'package unavailable';
        document.getElementById('boxFrom').textContent = 'please try again later';
        return;
    }
    
    // Update box label
    document.getElementById('boxTo').textContent = previewData.to || 'friend';
    document.getElementById('boxFrom').textContent = previewData.from || 'someone';
    
    // Show edit button if preview mode
    if (params.get('preview')) {
        const editBtn = document.getElementById('editBtn');
        if (editBtn) editBtn.style.display = 'block';
    }
}

function createDemoDrawing() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#a0422a';
    ctx.font = 'bold 60px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OK', 100, 100);
    return canvas.toDataURL();
}

// ========== OPEN PACKAGE ANIMATION ==========
function openPackage() {
    const boxTop = document.getElementById('boxTop');
    const landingView = document.getElementById('landingView');
    const goodiesView = document.getElementById('goodiesView');
    
    boxTop.classList.add('opening');
    
    setTimeout(() => {
        landingView.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        landingView.style.opacity = '0';
        landingView.style.transform = 'translateY(-50px)';
        
        setTimeout(() => {
            landingView.style.display = 'none';
            goodiesView.style.display = 'block';
            populateGoodies();
        }, 600);
    }, 800);
}

// ========== POPULATE GOODIES ==========
function populateGoodies() {
    const container = document.getElementById('goodiesItems');
    container.innerHTML = '';
    
    if (!previewData || !previewData.items || previewData.items.length === 0) {
        container.innerHTML = '<p style="font-family: var(--font-mono); color: var(--text-muted);">This package is empty 📦</p>';
        return;
    }
    
    const itemIconSrc = {
        note: 'note.png',
        song: 'song.png',
        video: 'video.png',
        gift: 'gift.png',
        voice: 'voice.png',
        location: 'map.png',
        coupon: 'coupon.png',
        news: 'news.png',
        rakhi: 'rakhi.png'
    };

    function iconMarkup(type) {
        const src = itemIconSrc[type];
        return src ? `<img src="${src}" alt="" aria-hidden="true">` : '📦';
    }

    previewData.items.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'goodie-item';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.style.animationDelay = `${0.1 + index * 0.15}s`;
        el.style.opacity = '0';
        el.style.animation = `bounceIn 0.6s ease-out ${0.1 + index * 0.15}s forwards`;
        
        switch(item.type) {
            case 'photo':
                el.innerHTML = `
                    <img class="goodie-item-photo" src="${item.src}" alt="Photo">
                    <span class="goodie-item-label">Photo</span>
                `;
                el.onclick = () => showPhotoDetail(item);
                break;
            case 'drawing':
                el.innerHTML = `
                    <img class="goodie-item-drawing" src="${item.src}" alt="Drawing">
                    <span class="goodie-item-label">Drawing</span>
                `;
                el.onclick = () => showDrawingDetail(item);
                break;
            case 'note':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('note')}</div>
                    <span class="goodie-item-label">Note</span>
                `;
                el.onclick = () => showNoteDetail(item);
                break;
            case 'voice':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('voice')}</div>
                    <span class="goodie-item-label">Voice</span>
                `;
                el.onclick = () => showVoicePlayer(item);
                break;
            case 'song':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('song')}</div>
                    <span class="goodie-item-label">${item.title || 'Song'}</span>
                `;
                el.onclick = () => window.open(item.link, '_blank');
                break;
            case 'video':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('video')}</div>
                    <span class="goodie-item-label">${item.title || 'Video'}</span>
                `;
                el.onclick = () => window.open(item.link, '_blank');
                break;
            case 'gift':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('gift')}</div>
                    <span class="goodie-item-label">${item.desc || 'Gift'}</span>
                `;
                el.onclick = () => window.open(item.link, '_blank');
                break;
            case 'coupon':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('coupon')}</div>
                    <span class="goodie-item-label">Coupon</span>
                `;
                el.onclick = () => showCouponDetail(item);
                break;
            case 'news':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('news')}</div>
                    <span class="goodie-item-label">News</span>
                `;
                el.onclick = () => showNewsDetail(item);
                break;
            case 'location':
                el.innerHTML = `
                    <div class="goodie-item-icon">${iconMarkup('location')}</div>
                    <span class="goodie-item-label">${item.name || 'Location'}</span>
                `;
                el.onclick = () => showLocationDetail(item);
                break;
            case 'rakhi':
                el.innerHTML = `
                    <div class="goodie-item-icon"><img src="rakhi.png" alt="Virtual Rakhi"></div>
                    <span class="goodie-item-label">Virtual Rakhi</span>
                `;
                el.onclick = () => showRakhiDetail(item);
                break;
            default:
                el.innerHTML = `
                    <div class="goodie-item-icon">📦</div>
                    <span class="goodie-item-label">${item.type}</span>
                `;
        }
        
        el.setAttribute('aria-label', `Open ${item.type}`);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.onclick && el.onclick();
            }
        });

        container.appendChild(el);
    });
}

// ========== DETAIL VIEWS ==========
function showNoteDetail(item) {
    document.getElementById('viewNoteText').textContent = item.text;
    document.getElementById('viewNoteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showPhotoDetail(item) {
    document.getElementById('viewPhotoImg').src = item.src;
    document.getElementById('viewPhotoCaption').textContent = item.caption || '';
    document.getElementById('viewPhotoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showDrawingDetail(item) {
    document.getElementById('viewDrawingImg').src = item.src;
    document.getElementById('viewDrawingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showCouponDetail(item) {
    document.getElementById('viewCouponTitle').textContent = item.title;
    document.getElementById('viewCouponDesc').textContent = item.desc || '';
    document.getElementById('viewCouponModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showNewsDetail(item) {
    document.getElementById('viewNewsHeadline').textContent = item.headline;
    document.getElementById('viewNewsStory').textContent = item.story || '';
    document.getElementById('viewNewsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showLocationDetail(item) {
    document.getElementById('viewLocationName').textContent = item.name;
    document.getElementById('viewLocationAddress').textContent = item.address || '';
    document.getElementById('viewLocationNote').textContent = item.note || '';
    document.getElementById('viewLocationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showRakhiDetail(item) {
    document.getElementById('viewRakhiMessage').textContent = item.message || '';
    const modal = document.getElementById('viewRakhiModal');
    modal.classList.add('active');
    const scene = modal.querySelector('.rakhi-scene');
    scene.classList.remove('is-animating');
    void scene.offsetWidth;
    scene.classList.add('is-animating');
    document.body.style.overflow = 'hidden';
}

function closeViewModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// Close on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ========== VOICE PLAYER ==========
function showVoicePlayer(item) {
    const player = document.getElementById('voicePlayer');
    player.style.display = 'flex';
    
    if (voiceAudio) {
        voiceAudio.pause();
    }
    
    voiceAudio = new Audio(item.audioData);
    isPlaying = false;
    document.getElementById('voicePlayBtn').textContent = '▶';
    document.getElementById('voiceProgress').style.width = '0%';
    
    voiceAudio.addEventListener('loadedmetadata', () => {
        updateVoiceTime();
    });
    
    voiceAudio.addEventListener('timeupdate', () => {
        if (voiceAudio.duration) {
            const progress = (voiceAudio.currentTime / voiceAudio.duration) * 100;
            document.getElementById('voiceProgress').style.width = progress + '%';
            updateVoiceTime();
        }
    });
    
    voiceAudio.addEventListener('ended', () => {
        isPlaying = false;
        document.getElementById('voicePlayBtn').textContent = '▶';
        document.getElementById('voiceProgress').style.width = '0%';
    });
}

function toggleVoicePlay() {
    if (!voiceAudio) return;
    
    if (isPlaying) {
        voiceAudio.pause();
        document.getElementById('voicePlayBtn').textContent = '▶';
    } else {
        voiceAudio.play();
        document.getElementById('voicePlayBtn').textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

function updateVoiceTime() {
    if (!voiceAudio) return;
    
    const current = formatTime(voiceAudio.currentTime);
    const total = formatTime(voiceAudio.duration || 0);
    document.getElementById('voiceTime').textContent = `${current} / ${total}`;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function closeVoicePlayer() {
    if (voiceAudio) {
        voiceAudio.pause();
        voiceAudio = null;
    }
    document.getElementById('voicePlayer').style.display = 'none';
    isPlaying = false;
}

// Progress bar click
document.addEventListener('DOMContentLoaded', () => {
    const progressContainer = document.querySelector('.voice-progress-container');
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            if (!voiceAudio || !voiceAudio.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            voiceAudio.currentTime = ratio * voiceAudio.duration;
        });
    }
});

// ========== GO TO EDIT ==========
function goToEdit() {
    window.location.href = 'index.html';
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    loadPreviewData();
});