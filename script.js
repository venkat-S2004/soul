// Supabase Configuration
const SUPABASE_PROJECT_ID = 'jonpaoyzqajjxvqlxxdy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbnBhb3l6cWFqanh2cWx4eGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Njk2MjEsImV4cCI6MjA3ODM0NTYyMX0.v5vW8kpn955qwjVvxpvp7_waVrnIXZLGo3Eh91gXAKk';
const API_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-29502e4b`;

const state = {
  currentFile: null,
  videoUrl: null,
  isPlaying: false,
  roomId: null,
  userName: 'Anonymous',
  isHost: false,
  isSyncing: false,
  lastSyncTime: 0,
  participants: [],
  activities: [],
  messages: []
};

const elements = {
  joinModal: document.getElementById('join-modal'),
  hostNameInput: document.getElementById('host-name-input'),
  createRoomBtn: document.getElementById('create-room-btn'),
  joinNameInput: document.getElementById('join-name-input'),
  roomIdInput: document.getElementById('room-id-input'),
  joinRoomBtn: document.getElementById('join-room-btn'),
  uploadZone: document.getElementById('upload-zone'),
  fileInput: document.getElementById('file-input'),
  fileCard: document.getElementById('file-card'),
  uploadProgress: document.getElementById('upload-progress'),
  fileName: document.getElementById('file-name'),
  fileSize: document.getElementById('file-size'),
  fileIcon: document.getElementById('file-icon'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  progressFileName: document.getElementById('progress-file-name'),
  progressFileSize: document.getElementById('progress-file-size'),
  clearFileBtn: document.getElementById('clear-file'),
  cancelUploadBtn: document.getElementById('cancel-upload'),
  videoPlayer: document.getElementById('video-player'),
  audioPlaceholder: document.getElementById('audio-placeholder'),
  noMediaPlaceholder: document.getElementById('no-media-placeholder'),
  audioFileName: document.getElementById('audio-file-name'),
  playBtn: document.getElementById('play-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  seekBackBtn: document.getElementById('seek-back-btn'),
  seekForwardBtn: document.getElementById('seek-forward-btn'),
  muteBtn: document.getElementById('mute-btn'),
  shareTimeBtn: document.getElementById('share-time-btn'),
  fullscreenBtn: document.getElementById('fullscreen-btn'),
  timeline: document.getElementById('timeline'),
  volumeSlider: document.getElementById('volume-slider'),
  currentTime: document.getElementById('current-time'),
  duration: document.getElementById('duration'),
  hostingId: document.getElementById('hosting-id'),
  copyIdBtn: document.getElementById('copy-id-btn'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  qrBtn: document.getElementById('qr-btn'),
  shareBtn: document.getElementById('share-btn'),
  hostingPanel: document.getElementById('hosting-panel'),
  qrModal: document.getElementById('qr-modal'),
  closeModalBtn: document.getElementById('close-modal'),
  modalCopyBtn: document.getElementById('modal-copy-btn'),
  downloadQrBtn: document.getElementById('download-qr-btn'),
  qrPattern: document.getElementById('qr-pattern'),
  participantsList: document.getElementById('participants-list'),
  activityList: document.getElementById('activity-list'),
  participantCount: document.getElementById('participant-count'),
  chatMessages: document.getElementById('chat-messages'),
  chatInput: document.getElementById('chat-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  toastContainer: document.getElementById('toast-container')
};

function init() {
  setupEventListeners();
  generateQRPattern();
  showJoinModal();
}

function setupEventListeners() {
  elements.createRoomBtn.addEventListener('click', createRoom);
  elements.joinRoomBtn.addEventListener('click', joinRoom);
  elements.roomIdInput.addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });

  elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
  elements.uploadZone.addEventListener('dragover', handleDragOver);
  elements.uploadZone.addEventListener('dragleave', handleDragLeave);
  elements.uploadZone.addEventListener('drop', handleDrop);
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.clearFileBtn.addEventListener('click', clearFile);
  elements.cancelUploadBtn.addEventListener('click', clearFile);

  elements.playBtn.addEventListener('click', play);
  elements.pauseBtn.addEventListener('click', pause);
  elements.seekBackBtn.addEventListener('click', () => seek(-10));
  elements.seekForwardBtn.addEventListener('click', () => seek(10));
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.shareTimeBtn.addEventListener('click', shareTime);
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
  elements.timeline.addEventListener('input', handleTimelineChange);
  elements.volumeSlider.addEventListener('input', handleVolumeChange);

  elements.videoPlayer.addEventListener('timeupdate', updateTimeDisplay);
  elements.videoPlayer.addEventListener('loadedmetadata', updateDuration);
  elements.videoPlayer.addEventListener('play', onVideoPlay);
  elements.videoPlayer.addEventListener('pause', onVideoPause);
  elements.videoPlayer.addEventListener('seeked', onVideoSeeked);

  elements.copyIdBtn.addEventListener('click', copyHostingId);
  elements.copyLinkBtn.addEventListener('click', copyLink);
  elements.qrBtn.addEventListener('click', openQRModal);
  elements.shareBtn.addEventListener('click', share);
  elements.closeModalBtn.addEventListener('click', closeQRModal);

  elements.qrModal.querySelector('.modal-backdrop').addEventListener('click', closeQRModal);

  elements.modalCopyBtn.addEventListener('click', copyLink);
  elements.downloadQrBtn.addEventListener('click', downloadQR);

  elements.sendMessageBtn.addEventListener('click', sendMessage);
  elements.chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

async function createRoom() {
  const hostName = elements.hostNameInput.value.trim() || 'Anonymous';
  state.userName = hostName;
  try {
    const response = await fetch(`${API_URL}/rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ hostName })
    });
    const data = await response.json();
    if (data.success) {
      state.roomId = data.roomId;
      state.isHost = true;
      elements.hostingId.textContent = data.roomId;
      document.getElementById('modal-hosting-id').textContent = data.roomId;
      document.getElementById('modal-url').textContent = `groic.app/j/${data.roomId}`;
      hideJoinModal();
      showToast(`Room created! ID: ${data.roomId}`, 'success');
      addActivity('Room created', 'success');
      startPolling();
    } else {
      showToast('Failed to create room: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error creating room:', error);
    showToast('Failed to create room. Please try again.', 'error');
  }
}

async function joinRoom() {
  const roomId = elements.roomIdInput.value.trim().toUpperCase();
  const userName = elements.joinNameInput.value.trim();
  if (!roomId) {
    showToast('Please enter a room ID', 'error');
    return;
  }
  if (!userName) {
    showToast('Please enter your name', 'error');
    return;
  }
  state.userName = userName;
  try {
    const response = await fetch(`${API_URL}/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ roomId, userName })
    });
    const data = await response.json();
    if (data.success) {
      state.roomId = roomId;
      state.isHost = false;
      elements.hostingId.textContent = roomId;
      document.getElementById('modal-hosting-id').textContent = roomId;
      document.getElementById('modal-url').textContent = `groic.app/j/${roomId}`;
      hideJoinModal();
      showToast(`Joined room: ${roomId}`, 'success');
      addActivity(`Joined room`, 'success');
      updateParticipantsFromRoom(data.room);
      startPolling();
    } else {
      showToast(data.error || 'Failed to join room', 'error');
    }
  } catch (error) {
    console.error('Error joining room:', error);
    showToast('Failed to join room. Please check the ID and try again.', 'error');
  }
}

let pollingInterval = null;

function startPolling() {
  pollingInterval = setInterval(() => {
    pollRoomUpdates();
    pollChatMessages();
    pollActivities();
  }, 2000);
  pollRoomUpdates();
  pollChatMessages();
  pollActivities();
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function pollRoomUpdates() {
  if (!state.roomId) return;
  try {
    const response = await fetch(`${API_URL}/rooms/${state.roomId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    if (data.success && data.room) {
      updateParticipantsFromRoom(data.room);
      syncVideoState(data.room.videoState);
    }
  } catch (error) {
    console.error('Error polling room updates:', error);
  }
}

async function pollChatMessages() {
  if (!state.roomId) return;
  try {
    const response = await fetch(`${API_URL}/rooms/${state.roomId}/messages`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    if (data.success && data.messages) {
      updateChatMessages(data.messages);
    }
  } catch (error) {
    console.error('Error polling messages:', error);
  }
}

async function pollActivities() {
  if (!state.roomId) return;
  try {
    const response = await fetch(`${API_URL}/rooms/${state.roomId}/activities`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    if (data.success && data.activities) {
      updateActivitiesFromServer(data.activities);
    }
  } catch (error) {
    console.error('Error polling activities:', error);
  }
}

function updateParticipantsFromRoom(room) {
  state.participants = room.participants || [];
  renderParticipants();
  elements.participantCount.textContent = state.participants.length;
  document.querySelector('.badge-purple').textContent = state.participants.length;
}

function updateChatMessages(messages) {
  if (JSON.stringify(messages) !== JSON.stringify(state.messages)) {
    state.messages = messages;
    renderChatMessages();
  }
}

function updateActivitiesFromServer(activities) {
  if (JSON.stringify(activities) !== JSON.stringify(state.activities)) {
    state.activities = activities;
    renderActivitiesFromServer();
  }
}

function syncVideoState(videoState) {
  if (!state.currentFile || state.isSyncing) return;

  const timeDiff = Math.abs(elements.videoPlayer.currentTime - videoState.currentTime);
  const updateTime = new Date(videoState.lastUpdate).getTime();

  if (updateTime > state.lastSyncTime && timeDiff > 1) {
    state.isSyncing = true;
    elements.videoPlayer.currentTime = videoState.currentTime;

    if (videoState.isPlaying && elements.videoPlayer.paused) {
      elements.videoPlayer.play().catch(() => {});
    } else if (!videoState.isPlaying && !elements.videoPlayer.paused) {
      elements.videoPlayer.pause();
    }

    state.lastSyncTime = updateTime;
    setTimeout(() => (state.isSyncing = false), 500);
  }
}

async function broadcastVideoState() {
  if (!state.roomId || !state.currentFile || state.isSyncing) return;
  try {
    await fetch(`${API_URL}/rooms/${state.roomId}/video-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        isPlaying: !elements.videoPlayer.paused,
        currentTime: elements.videoPlayer.currentTime
      })
    });
  } catch (error) {
    console.error('Error broadcasting video state:', error);
  }
}

function onVideoPlay() {
  state.isPlaying = true;
  broadcastVideoState();
}

function onVideoPause() {
  state.isPlaying = false;
  broadcastVideoState();
}

function onVideoSeeked() {
  broadcastVideoState();
}

function handleDragOver(e) {
  e.preventDefault();
  elements.uploadZone.classList.add('dragging');
}

function handleDragLeave(e) {
  e.preventDefault();
  elements.uploadZone.classList.remove('dragging');
}

function handleDrop(e) {
  e.preventDefault();
  elements.uploadZone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  if (!state.isHost) {
    showToast('Only the host can upload files', 'error');
    return;
  }

  const maxSize = 2 * 1024 * 1024 * 1024;
  const validTypes = [
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/flac'
  ];

  if (!validTypes.includes(file.type)) {
    showToast('Invalid file type. Please upload a supported video or audio file.', 'error');
    return;
  }

  if (file.size > maxSize) {
    showToast('File size exceeds 2GB limit', 'error');
    return;
  }

  state.currentFile = file;
  simulateUpload(file);
}

function simulateUpload(file) {
  state.uploadProgress = 0;
  elements.uploadZone.style.display = 'none';
  elements.fileCard.style.display = 'none';
  elements.uploadProgress.style.display = 'block';
  elements.progressFileName.textContent = file.name;
  elements.progressFileSize.textContent = formatFileSize(file.size);

  const isVideo = file.type.startsWith('video/');
  elements.uploadProgress.querySelector('svg').innerHTML = isVideo
    ? '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>'
    : '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>';

  const interval = setInterval(() => {
    state.uploadProgress += 10;
    elements.progressFill.style.width = state.uploadProgress + '%';
    elements.progressText.textContent = state.uploadProgress + '% uploaded';

    if (state.uploadProgress >= 100) {
      clearInterval(interval);
      finishUpload(file);
    }
  }, 200);
}

function finishUpload(file) {
  elements.uploadProgress.style.display = 'none';
  elements.fileCard.style.display = 'block';
  elements.fileName.textContent = file.name;
  elements.fileSize.textContent = formatFileSize(file.size);

  const isVideo = file.type.startsWith('video/');
  elements.fileIcon.innerHTML = isVideo
    ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'
    : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';

  state.videoUrl = URL.createObjectURL(file);
  elements.videoPlayer.src = state.videoUrl;
  updatePlayerState();

  elements.hostingPanel.classList.add('active');
  addActivity(`File uploaded: ${file.name}`, 'success');
  showToast('File uploaded successfully!', 'success');
}

function clearFile() {
  if (!state.isHost) {
    showToast('Only the host can clear files', 'error');
    return;
  }

  state.currentFile = null;

  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = null;
  }

  state.isPlaying = false;
  elements.uploadZone.style.display = 'block';
  elements.fileCard.style.display = 'none';
  elements.uploadProgress.style.display = 'none';
  elements.videoPlayer.src = '';
  updatePlayerState();

  elements.hostingPanel.classList.remove('active');
  addActivity('Video cleared', 'info');
  showToast('Video cleared', 'info');
  broadcastVideoState();
}

function updatePlayerState() {
  const hasFile = state.currentFile !== null;
  const isVideo = hasFile && state.currentFile.type.startsWith('video/');
  const isAudio = hasFile && state.currentFile.type.startsWith('audio/');

  if (isVideo) {
    elements.videoPlayer.classList.add('visible');
    elements.audioPlaceholder.classList.remove('visible');
    elements.noMediaPlaceholder.classList.remove('visible');
  } else if (isAudio) {
    elements.videoPlayer.classList.remove('visible');
    elements.audioPlaceholder.classList.add('visible');
    elements.noMediaPlaceholder.classList.remove('visible');
    elements.audioFileName.textContent = state.currentFile.name;
  } else {
    elements.videoPlayer.classList.remove('visible');
    elements.audioPlaceholder.classList.remove('visible');
    elements.noMediaPlaceholder.classList.add('visible');
  }

  elements.playBtn.disabled = !hasFile;
  elements.pauseBtn.disabled = !hasFile;
  elements.seekBackBtn.disabled = !hasFile;
  elements.seekForwardBtn.disabled = !hasFile;
  elements.muteBtn.disabled = !hasFile;
  elements.shareTimeBtn.disabled = !hasFile;
  elements.fullscreenBtn.disabled = !hasFile;
  elements.timeline.disabled = !hasFile;
  elements.volumeSlider.disabled = !hasFile;
}

function play() {
  if (elements.videoPlayer.src) {
    elements.videoPlayer.play();
    addActivity('Playback started', 'success');
  }
}

function pause() {
  elements.videoPlayer.pause();
  addActivity('Playback paused', 'info');
}

function seek(seconds) {
  elements.videoPlayer.currentTime += seconds;
  addActivity(`Seeked ${seconds > 0 ? '+' : ''}${seconds}s`, 'info');
}

function toggleMute() {
  elements.videoPlayer.muted = !elements.videoPlayer.muted;
  updateMuteIcon();
}

function updateMuteIcon() {
  const svg = elements.muteBtn.querySelector('svg');
  if (elements.videoPlayer.muted) {
    svg.innerHTML =
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
  } else {
    svg.innerHTML =
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
  }
}

function shareTime() {
  const currentTime = formatTime(elements.videoPlayer.currentTime);
  copyToClipboard(`Check this out at ${currentTime}!`);
  showToast(`Timestamp ${currentTime} copied!`, 'info');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    elements.videoPlayer.requestFullscreen().catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

function handleTimelineChange(e) {
  const time = (e.target.value / 100) * elements.videoPlayer.duration;
  elements.videoPlayer.currentTime = time;
}

function handleVolumeChange(e) {
  elements.videoPlayer.volume = e.target.value / 100;
}

function updateTimeDisplay() {
  if (!elements.videoPlayer.duration) return;
  const progress = (elements.videoPlayer.currentTime / elements.videoPlayer.duration) * 100;
  elements.timeline.value = progress;
  elements.currentTime.textContent = formatTime(elements.videoPlayer.currentTime);
}

function updateDuration() {
  elements.duration.textContent = formatTime(elements.videoPlayer.duration);
}

async function sendMessage() {
  const message = elements.chatInput.value.trim();
  if (!message) return;
  if (!state.roomId) {
    showToast('You must be in a room to send messages', 'error');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/rooms/${state.roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ userName: state.userName, message })
    });
    const data = await response.json();
    if (data.success) {
      elements.chatInput.value = '';
    } else {
      showToast('Failed to send message', 'error');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Failed to send message', 'error');
  }
}

function renderChatMessages() {
  elements.chatMessages.innerHTML = '';
  state.messages.forEach(msg => {
    const isSent = msg.userName === state.userName;
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
    messageEl.innerHTML = `<div class="chat-message-header">${msg.userName}</div><div class="chat-message-bubble">${escapeHtml(
      msg.message
    )}</div><div class="chat-message-time">${formatChatTime(msg.timestamp)}</div>`;
    elements.chatMessages.appendChild(messageEl);
  });
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addActivity(description, type = 'info') {
  if (!state.roomId) return;
  const activity = { description, timestamp: new Date().toISOString(), type };
  state.activities.unshift(activity);
  renderActivities();
}

function renderActivities() {
  const localActivities = state.activities.slice(0, 10);
  elements.activityList.innerHTML = localActivities
    .map((activity, index) => {
      const type = activity.type || 'info';
      const isLast = index === localActivities.length - 1;
      return `<div class="activity-item"><div class="activity-line"><div class="activity-dot ${type}"></div>${
        !isLast ? '<div class="activity-connector"></div>' : ''
      }</div><div class="activity-content ${type}"><div class="activity-time">${formatActivityTime(
        activity.timestamp
      )}</div><div class="activity-message">${escapeHtml(activity.description)}</div></div></div>`;
    })
    .join('');
}

function renderActivitiesFromServer() {
  const activities = state.activities.slice(0, 10);
  elements.activityList.innerHTML = activities
    .map((activity, index) => {
      const type = 'info';
      const isLast = index === activities.length - 1;
      return `<div class="activity-item"><div class="activity-line"><div class="activity-dot ${type}"></div>${
        !isLast ? '<div class="activity-connector"></div>' : ''
      }</div><div class="activity-content ${type}"><div class="activity-time">${formatActivityTime(
        activity.timestamp
      )}</div><div class="activity-message">${escapeHtml(activity.description)}</div></div></div>`;
    })
    .join('');
}

function renderParticipants() {
  elements.participantsList.innerHTML = state.participants
    .map(participant => {
      const initials = getInitials(participant.name);
      const isHost = participant.isHost;
      return `<div class="participant-item"><div class="participant-avatar"><div class="avatar">${initials}</div><div class="participant-status online"></div></div><div class="participant-info"><div class="participant-name">${escapeHtml(
        participant.name
      )} ${isHost ? '<span class="host-badge">HOST</span>' : ''}</div></div></div>`;
    })
    .join('');
}
async function pollRoomUpdates() {
  // existing code...
  if (data.success && data.room) {
    updateParticipantsFromRoom(data.room);

    // இது புதிதாக சேர்க்கப்படும்
    const videoUrl = data.room.videoUrl;
    if (videoUrl && elements.videoPlayer.src !== videoUrl) {
      elements.videoPlayer.src = videoUrl;
    }

    syncVideoState(data.room.videoState);
  }
  // existing catch block...
}

async function broadcastVideoState() {
  if (!state.roomId || !state.currentFile || state.isSyncing) return;
  try {
    await fetch(`${API_URL}/rooms/${state.roomId}/video-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        isPlaying: !elements.videoPlayer.paused,
        currentTime: elements.videoPlayer.currentTime,
        videoUrl: state.videoUrl || ''  // URL-ஐ கூட அனுப்பும்
      })
    });
  } catch (error) {
    console.error('Error broadcasting video state:', error);
  }
}


function copyHostingId() {
  copyToClipboard(state.roomId || 'GROIC-AB12CD34');
  showToast('Hosting ID copied!', 'success');
}

function copyLink() {
  const link = `groic.app/j/${state.roomId || 'GROIC-AB12CD34'}`;
  copyToClipboard(link);
  showToast('Link copied!', 'success');
}

function openQRModal() {
  elements.qrModal.classList.add('visible');
}

function closeQRModal() {
  elements.qrModal.classList.remove('visible');
}

function share() {
  if (navigator.share) {
    navigator
      .share({
        title: 'Join my Groic session!',
        text: `Join me on Groic with ID: ${state.roomId}`,
        url: `https://groic.app/j/${state.roomId}`
      })
      .catch(() => {});
  } else {
    copyLink();
  }
}

function downloadQR() {
  showToast('QR code download would happen here', 'info');
}

function showJoinModal() {
  elements.joinModal.classList.add('active');
}

function hideJoinModal() {
  elements.joinModal.classList.remove('active');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatActivityTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    warning:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  toast.innerHTML = `<div class="toast-icon">${icons[type]}</div><div class="toast-message">${escapeHtml(
    message
  )}</div>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function generateQRPattern() {
  elements.qrPattern.innerHTML = '';
  for (let i = 0; i < 64; i++) {
    if (Math.random() > 0.5) {
      const pixel = document.createElement('div');
      pixel.className = 'qr-pixel';
      elements.qrPattern.appendChild(pixel);
    } else {
      elements.qrPattern.appendChild(document.createElement('div'));
    }
  }
}

init();
