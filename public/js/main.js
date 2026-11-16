// GitEx Dashboard Shell Client (GITEX-002, 003, 011, 012)
import GitExHistory from './history.storage.js';

if (typeof window !== 'undefined' && !window.GitExHistory) {
  window.GitExHistory = GitExHistory;
}

(function () {
  'use strict';

  const DAILY_QUOTA_LIMIT = 5;

  const STORAGE_KEYS = {
    HISTORY: 'gitex_history',
    DAILY_QUOTA: 'gitex_daily_quota',
  };

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDailyQuotaUsage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTA);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === getTodayDateString()) {
          return typeof parsed.count === 'number' ? parsed.count : 0;
        }
      }
    } catch {}
    return 0;
  }

  function incrementDailyQuotaUsage() {
    const today = getTodayDateString();
    let count = getDailyQuotaUsage();
    count += 1;
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_QUOTA, JSON.stringify({ date: today, count }));
    } catch {}
    return count;
  }

  function isDailyQuotaExceeded() {
    return getDailyQuotaUsage() >= DAILY_QUOTA_LIMIT;
  }

  // -------------------------------------------------------------
  // Provider Detection & URL Form Interaction
  // -------------------------------------------------------------
  const repoForm = document.getElementById('repo-form');
  const urlInput = document.getElementById('repo-url');
  const providerBadge = document.getElementById('provider-badge');
  const analyzeBtn = document.getElementById('btn-analyze');
  const pasteBtn = document.getElementById('btn-paste');
  const validationMsg = document.getElementById('validation-msg');

  // Progress modal elements
  const progressModal = document.getElementById('progress-modal');
  const progressRepoBadge = document.getElementById('progress-repo-badge');
  const stageCurrentMsg = document.getElementById('stage-current-message');
  const progressErrorContainer = document.getElementById('progress-error-container');
  const progressErrorText = document.getElementById('progress-error-text');
  const btnProgressDismiss = document.getElementById('btn-progress-dismiss');
  const btnProgressClose = document.getElementById('btn-progress-close');
  const progressDismissContainer = document.getElementById('progress-dismiss-container');
  const btnProgressBackground = document.getElementById('btn-progress-background');

  // Background Progress Snackbar elements
  const progressSnackbar = document.getElementById('gitex-progress-snackbar');
  const snackbarSpinner = document.getElementById('snackbar-spinner');
  const snackbarIcon = document.getElementById('snackbar-icon');
  const snackbarRepoTitle = document.getElementById('snackbar-repo-title');
  const snackbarStatusText = document.getElementById('snackbar-status-text');
  const btnSnackbarAction = document.getElementById('btn-snackbar-action');
  const btnSnackbarClose = document.getElementById('btn-snackbar-close');

  // Quota modal elements
  const quotaModal = document.getElementById('quota-modal');
  const quotaTitle = document.getElementById('quota-title');
  const quotaMessage = document.getElementById('quota-message');
  const quotaCountBadge = document.getElementById('quota-count-badge');
  const btnQuotaDismiss = document.getElementById('btn-quota-dismiss');

  function showQuotaModal() {
    if (!quotaModal) return;

    const currentLang = localStorage.getItem('gitex_lang') || 'en';
    const isId = (currentLang === 'id');

    if (quotaTitle) {
      quotaTitle.textContent = isId ? 'Batas Harian Tercapai' : 'Daily Limit Reached';
    }
    if (quotaMessage) {
      quotaMessage.textContent = isId
        ? `Anda telah mencapai batas maksimum ${DAILY_QUOTA_LIMIT} kali hit analisis repositori per hari (${DAILY_QUOTA_LIMIT}/${DAILY_QUOTA_LIMIT} kuota harian terpakai). Penjagaan ini diterapkan untuk menjaga performa server dan efisiensi kuota API. Silakan coba kembali besok!`
        : `You have reached your daily limit of ${DAILY_QUOTA_LIMIT} repository explanations for today (${DAILY_QUOTA_LIMIT}/${DAILY_QUOTA_LIMIT} daily quota used). This guard preserves server stability and API quota. Please try again tomorrow!`;
    }
    if (quotaCountBadge) {
      quotaCountBadge.textContent = isId
        ? `${DAILY_QUOTA_LIMIT} / ${DAILY_QUOTA_LIMIT} Kuota Terpakai`
        : `${DAILY_QUOTA_LIMIT} / ${DAILY_QUOTA_LIMIT} Quota Used`;
    }
    if (btnQuotaDismiss) {
      btnQuotaDismiss.textContent = isId ? 'Mengerti' : 'Understood';
    }

    quotaModal.classList.remove('hidden');
    quotaModal.style.display = 'flex';
  }

  function hideQuotaModal() {
    if (!quotaModal) return;
    quotaModal.classList.add('hidden');
    quotaModal.style.display = 'none';
  }

  if (btnQuotaDismiss) {
    btnQuotaDismiss.addEventListener('click', hideQuotaModal);
  }

  if (quotaModal) {
    quotaModal.addEventListener('click', (e) => {
      if (e.target === quotaModal) {
        hideQuotaModal();
      }
    });
  }

  const STAGES_ORDER = ['Validating', 'Fetching', 'Processing', 'Analyzing', 'Generating'];

  function updateBadge(provider) {
    if (!providerBadge) return;
    providerBadge.className = 'provider-detect-badge';
    if (provider === 'github') {
      providerBadge.textContent = 'GITHUB';
      providerBadge.classList.add('is-github');
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else if (provider === 'gitlab') {
      providerBadge.textContent = 'GITLAB';
      providerBadge.classList.add('is-gitlab');
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else if (provider === 'invalid') {
      providerBadge.textContent = 'UNSUPPORTED';
      providerBadge.style.display = 'inline-block';
      if (urlInput) urlInput.classList.add('has-badge');
    } else {
      providerBadge.textContent = '';
      providerBadge.style.display = 'none';
      if (urlInput) urlInput.classList.remove('has-badge');
    }
  }

  function detectProviderPreview(val) {
    const trimmed = (val || '').trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed.includes('github.com')) return 'github';
    if (trimmed.includes('gitlab.com')) return 'gitlab';
    return null;
  }

  function showValidationError(message) {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = message;
    validationMsg.className = 'validation-message is-error';
    urlInput.classList.add('is-invalid');
    urlInput.setAttribute('aria-invalid', 'true');
  }

  function showValidationSuccess(message) {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = message;
    validationMsg.className = 'validation-message is-success';
    urlInput.classList.remove('is-invalid');
    urlInput.removeAttribute('aria-invalid');
  }

  function clearValidation() {
    if (!validationMsg || !urlInput) return;
    validationMsg.textContent = '';
    validationMsg.className = 'validation-message';
    urlInput.classList.remove('is-invalid');
    urlInput.removeAttribute('aria-invalid');
  }

  function setLoadingState(isLoading) {
    if (!analyzeBtn || !urlInput) return;
    if (isLoading) {
      analyzeBtn.disabled = true;
      if (pasteBtn) pasteBtn.disabled = true;
      urlInput.disabled = true;
      analyzeBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Explaining...</span>';
    } else {
      analyzeBtn.disabled = false;
      if (pasteBtn) pasteBtn.disabled = false;
      urlInput.disabled = false;
      analyzeBtn.innerHTML = '<span>Explain repository</span>';
    }
  }

  let currentActiveStage = 'Validating';

  function updateStageUI(activeStage, message) {
    if (activeStage === 'Failed') {
      if (stageCurrentMsg) {
        stageCurrentMsg.classList.add('hidden');
        stageCurrentMsg.style.display = 'none';
        stageCurrentMsg.textContent = '';
      }

      const failIdx = STAGES_ORDER.indexOf(currentActiveStage);
      STAGES_ORDER.forEach((stage, idx) => {
        const el = document.getElementById(`stage-${stage.toLowerCase()}`);
        if (!el) return;

        el.classList.remove('pending', 'active', 'complete', 'failed');
        const icon = el.querySelector('.stage-icon-circle');

        if (idx === failIdx) {
          el.classList.add('failed');
          if (icon) icon.textContent = '✕';
        } else if (idx < failIdx) {
          el.classList.add('complete');
          if (icon) icon.textContent = '✓';
        } else {
          el.classList.add('pending');
          if (icon) icon.textContent = String(idx + 1);
        }
      });
      return;
    }

    if (stageCurrentMsg && message) {
      stageCurrentMsg.classList.remove('hidden');
      stageCurrentMsg.style.display = 'block';
      stageCurrentMsg.textContent = message;
    }

    currentActiveStage = activeStage;
    const activeIdx = STAGES_ORDER.indexOf(activeStage);

    STAGES_ORDER.forEach((stage, idx) => {
      const el = document.getElementById(`stage-${stage.toLowerCase()}`);
      if (!el) return;

      el.classList.remove('pending', 'active', 'complete', 'failed');
      const icon = el.querySelector('.stage-icon-circle');

      if (activeStage === 'Completed' || idx < activeIdx) {
        el.classList.add('complete');
        if (icon) icon.textContent = '✓';
      } else if (idx === activeIdx) {
        el.classList.add('active');
        if (icon) icon.textContent = '';
      } else {
        el.classList.add('pending');
        if (icon) icon.textContent = String(idx + 1);
      }
    });

    // When reaching Generating stage, surface the dismiss-to-background action
    if (activeStage === 'Generating') {
      if (progressDismissContainer) {
        progressDismissContainer.style.display = 'block';
      }
      if (btnProgressClose) {
        btnProgressClose.classList.remove('hidden');
        btnProgressClose.style.display = 'flex';
      }
    } else if (activeStage !== 'Completed' && activeStage !== 'Failed') {
      if (progressDismissContainer) {
        progressDismissContainer.style.display = 'none';
      }
      if (btnProgressClose) {
        btnProgressClose.classList.add('hidden');
        btnProgressClose.style.display = 'none';
      }
    }
  }

  function showProgressModal(repoUrl) {
    if (!progressModal) return;
    if (progressRepoBadge) {
      progressRepoBadge.textContent = repoUrl;
    }
    if (stageCurrentMsg) {
      stageCurrentMsg.classList.remove('hidden');
      stageCurrentMsg.style.display = 'block';
      stageCurrentMsg.textContent = 'Validating repository URL...';
    }
    if (progressErrorContainer) {
      progressErrorContainer.classList.add('hidden');
      progressErrorContainer.style.display = 'none';
    }
    if (progressErrorText) {
      progressErrorText.textContent = '';
    }
    if (progressDismissContainer) {
      progressDismissContainer.style.display = 'none';
    }
    if (btnProgressClose) {
      btnProgressClose.classList.add('hidden');
      btnProgressClose.style.display = 'none';
    }
    updateStageUI('Validating', 'Validating repository URL...');
    progressModal.classList.remove('hidden');
  }

  function hideProgressModal() {
    if (!progressModal) return;
    progressModal.classList.add('hidden');
    if (progressErrorContainer) {
      progressErrorContainer.classList.add('hidden');
      progressErrorContainer.style.display = 'none';
    }
  }

  function showProgressError(errorMsg) {
    const text = (typeof errorMsg === 'string' && errorMsg.trim()) ? errorMsg.trim() : 'An error occurred during analysis. Please try again.';
    if (stageCurrentMsg) {
      stageCurrentMsg.classList.add('hidden');
      stageCurrentMsg.style.display = 'none';
      stageCurrentMsg.textContent = '';
    }
    if (progressErrorContainer && progressErrorText) {
      progressErrorText.textContent = text;
      progressErrorContainer.classList.remove('hidden');
      progressErrorContainer.style.display = 'flex';
    }
    updateStageUI('Failed', text);
  }

  // -------------------------------------------------------------
  // Background Progress Snackbar & Active Analysis State
  // -------------------------------------------------------------
  let currentRunningAnalysis = null;
  let snackbarHideTimeout = null;

  function extractRepoMetaFromUrl(rawUrl) {
    const url = (rawUrl || '').trim();
    const provider = detectProviderPreview(url) || 'github';
    let fullName = 'Repository';
    let owner = '';
    let name = '';

    try {
      const clean = url.replace(/\.git$/i, '').replace(/\/+$/, '');
      const parts = clean.split('/');
      if (parts.length >= 2) {
        name = parts[parts.length - 1];
        owner = parts[parts.length - 2];
        fullName = `${owner}/${name}`;
      }
    } catch {}

    return { fullName, owner, name, provider };
  }

  function showProgressSnackbar(analysis) {
    if (!progressSnackbar) return;
    if (snackbarHideTimeout) clearTimeout(snackbarHideTimeout);

    progressSnackbar.classList.remove('hidden', 'is-completed', 'is-failed');
    progressSnackbar.style.display = 'block';

    if (snackbarSpinner) snackbarSpinner.classList.remove('hidden');
    if (snackbarIcon) snackbarIcon.classList.add('hidden');
    if (btnSnackbarAction) btnSnackbarAction.classList.add('hidden');

    if (snackbarRepoTitle) {
      snackbarRepoTitle.textContent = analysis?.meta?.fullName || analysis?.url || 'Repository';
    }
    if (snackbarStatusText) {
      snackbarStatusText.textContent = 'Generating technical guide... (Click to view progress)';
    }

    void progressSnackbar.offsetWidth;
    progressSnackbar.classList.add('show');
  }

  function updateProgressSnackbarCompleted(record) {
    if (!progressSnackbar) return;
    if (snackbarHideTimeout) clearTimeout(snackbarHideTimeout);

    progressSnackbar.classList.remove('hidden', 'is-failed');
    progressSnackbar.classList.add('is-completed', 'show');
    progressSnackbar.style.display = 'block';

    if (snackbarSpinner) snackbarSpinner.classList.add('hidden');
    if (snackbarIcon) {
      snackbarIcon.classList.remove('hidden');
      snackbarIcon.textContent = '✓';
      snackbarIcon.style.color = '#22c55e';
      snackbarIcon.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
    }

    if (snackbarRepoTitle) {
      snackbarRepoTitle.textContent = record.fullName || (record.owner && record.name ? `${record.owner}/${record.name}` : record.name) || 'Repository';
    }
    if (snackbarStatusText) {
      snackbarStatusText.textContent = 'Progress finish! Analysis ready to view.';
    }
    if (btnSnackbarAction) {
      btnSnackbarAction.classList.remove('hidden');
      btnSnackbarAction.textContent = 'View Analysis';
      btnSnackbarAction.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/analysis/${encodeURIComponent(record.id)}`;
      };
    }

    // Auto-hide completed snackbar after 8s
    snackbarHideTimeout = setTimeout(() => {
      hideProgressSnackbar();
    }, 8000);
  }

  function updateProgressSnackbarFailed(errorMsg) {
    if (!progressSnackbar) return;
    if (snackbarHideTimeout) clearTimeout(snackbarHideTimeout);

    progressSnackbar.classList.remove('hidden', 'is-completed');
    progressSnackbar.classList.add('is-failed', 'show');
    progressSnackbar.style.display = 'block';

    if (snackbarSpinner) snackbarSpinner.classList.add('hidden');
    if (snackbarIcon) {
      snackbarIcon.classList.remove('hidden');
      snackbarIcon.textContent = '✕';
      snackbarIcon.style.color = '#ef4444';
      snackbarIcon.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    }
    if (snackbarStatusText) {
      snackbarStatusText.textContent = `Analysis failed (${errorMsg || 'Error'}). Click to retry.`;
    }
  }

  function hideProgressSnackbar() {
    if (!progressSnackbar) return;
    progressSnackbar.classList.remove('show');
    setTimeout(() => {
      progressSnackbar.classList.add('hidden');
      progressSnackbar.style.display = 'none';
    }, 300);
  }

  function finishRunningAnalysisUI(isSuccess) {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.removeAttribute('aria-disabled');
      analyzeBtn.innerHTML = '<span>Explain repository</span>';
    }
    if (urlInput) {
      urlInput.disabled = false;
    }
    if (pasteBtn) {
      pasteBtn.disabled = false;
    }
  }

  function dismissToBackground() {
    if (!currentRunningAnalysis) return;
    currentRunningAnalysis.isDismissed = true;

    hideProgressModal();

    // 1. Clear input URL field and reset validation
    if (urlInput) {
      urlInput.value = '';
      urlInput.disabled = false;
      updateBadge(null);
      clearValidation();
    }
    if (pasteBtn) {
      pasteBtn.disabled = false;
    }

    // 2. Temporarily disable the Explain repository button while in background
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute('aria-disabled', 'true');
      analyzeBtn.innerHTML = '<span>Explain repository</span>';
    }

    // 3. Save temporary generating record to LocalStorage
    const tempRecord = {
      id: currentRunningAnalysis.tempId || `temp-${Date.now()}`,
      url: currentRunningAnalysis.url,
      fullName: currentRunningAnalysis.meta.fullName,
      owner: currentRunningAnalysis.meta.owner,
      name: currentRunningAnalysis.meta.name,
      provider: currentRunningAnalysis.meta.provider,
      language: 'Analyzing',
      status: 'generating',
      analyzedAt: new Date().toISOString(),
    };
    currentRunningAnalysis.tempId = tempRecord.id;

    saveRecordToHistory(tempRecord);
    if (typeof switchTab === 'function') {
      switchTab('history');
    }

    showProgressSnackbar(currentRunningAnalysis);
  }

  if (btnProgressBackground) {
    btnProgressBackground.addEventListener('click', dismissToBackground);
  }
  if (btnProgressClose) {
    btnProgressClose.addEventListener('click', dismissToBackground);
  }

  if (progressSnackbar) {
    progressSnackbar.addEventListener('click', (e) => {
      if (e.target.closest('#btn-snackbar-close') || e.target.closest('#btn-snackbar-action')) {
        return;
      }
      if (currentRunningAnalysis && currentRunningAnalysis.isCompleted && currentRunningAnalysis.completedRecord) {
        window.location.href = `/analysis/${encodeURIComponent(currentRunningAnalysis.completedRecord.id)}`;
      } else if (currentRunningAnalysis) {
        // Re-open progress modal
        currentRunningAnalysis.isDismissed = false;
        hideProgressSnackbar();
        showProgressModal(currentRunningAnalysis.url);
        updateStageUI(currentRunningAnalysis.stage || 'Generating', currentRunningAnalysis.message);
      }
    });
  }

  if (btnSnackbarClose) {
    btnSnackbarClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideProgressSnackbar();
    });
  }

  if (btnProgressDismiss) {
    btnProgressDismiss.addEventListener('click', () => {
      hideProgressModal();
      setLoadingState(false);
      if (urlInput) urlInput.focus();
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      clearValidation();
      const detected = detectProviderPreview(urlInput.value);
      updateBadge(detected);

      // Keep explain button disabled if an analysis is actively running in background
      if (currentRunningAnalysis && !currentRunningAnalysis.isCompleted && analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.setAttribute('aria-disabled', 'true');
      }
    });
  }

  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && typeof text === 'string') {
          urlInput.value = text.trim();
          urlInput.focus();
          urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (err) {
        console.warn('[GitEx] Clipboard read denied or unsupported:', err);
        urlInput.focus();
      }
    });
  }

  /**
   * Runs the full analysis pipeline using Server-Sent Events (SSE)
   */
  async function startAnalysis(rawUrl) {
    if (isDailyQuotaExceeded()) {
      showQuotaModal();
      return;
    }

    // Increment daily quota count for this session
    incrementDailyQuotaUsage();

    // Purge any existing LocalStorage record for this URL so analysis starts 100% fresh
    if (window.GitExHistory) {
      window.GitExHistory.deleteByUrl(rawUrl);
    }

    const repoMeta = extractRepoMetaFromUrl(rawUrl);
    currentRunningAnalysis = {
      url: rawUrl,
      meta: repoMeta,
      stage: 'Validating',
      message: 'Validating repository URL...',
      isDismissed: false,
      isCompleted: false,
      completedRecord: null,
      tempId: null,
    };

    hideProgressSnackbar();
    showProgressModal(rawUrl);
    setLoadingState(true);
    clearValidation();

    const streamUrl = `/api/analyze/stream?url=${encodeURIComponent(rawUrl)}&fresh=true`;
    let eventSource = null;
    let isCompleted = false;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('stage', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (currentRunningAnalysis) {
            currentRunningAnalysis.stage = payload.stage;
            currentRunningAnalysis.message = payload.message;
            if (currentRunningAnalysis.isDismissed && snackbarStatusText) {
              snackbarStatusText.textContent = `${payload.message || 'Analyzing repository...'} (Click to view progress)`;
            }
          }
          updateStageUI(payload.stage, payload.message);
        } catch (e) {
          console.warn('[GitEx] Stage event parse error:', e);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        isCompleted = true;
        // Close eventSource immediately to prevent browser from firing 'error' on stream end
        try { eventSource.close(); } catch {}

        try {
          if (progressErrorContainer) {
            progressErrorContainer.classList.add('hidden');
            progressErrorContainer.style.display = 'none';
          }
          const payload = JSON.parse(event.data);
          const record = payload.record;

          if (currentRunningAnalysis) {
            currentRunningAnalysis.isCompleted = true;
            currentRunningAnalysis.completedRecord = record;
          }

          finishRunningAnalysisUI(true);

          // Save fresh record to local history (replaces any temporary in-progress record)
          saveRecordToHistory(record);

          if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
            updateProgressSnackbarCompleted(record);
          } else {
            updateStageUI('Completed', 'Analysis complete! Redirecting...');
            setTimeout(() => {
              window.location.href = `/analysis/${encodeURIComponent(record.id)}`;
            }, 450);
          }
        } catch (e) {
          console.error('[GitEx] Complete event parse error:', e);
          if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
            updateProgressSnackbarFailed('Failed to process completed record.');
          } else {
            showProgressError('Failed to process completed analysis record.');
          }
        }
      });

      // Custom pipeline error event from server
      eventSource.addEventListener('pipeline-error', (event) => {
        let msg = 'Analysis failed.';
        try {
          if (event.data) {
            const data = JSON.parse(event.data);
            msg = data.message || msg;
          }
        } catch {}

        finishRunningAnalysisUI(false);

        if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
          updateProgressSnackbarFailed(msg);
        } else {
          showProgressError(msg);
        }
        try { eventSource.close(); } catch {}
      });

      // Native browser EventSource error (triggers on network disconnect / drop)
      let sseErrorCount = 0;
      let recoveryPolling = false;

      const attemptRecoveryPolling = async () => {
        if (recoveryPolling || isCompleted) return;
        recoveryPolling = true;

        for (let attempt = 1; attempt <= 8; attempt++) {
          if (isCompleted) break;
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (isCompleted) break;

          try {
            const checkRes = await fetch(`/api/analysis?url=${encodeURIComponent(rawUrl)}`, {
              headers: { Accept: 'application/json' },
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.success && checkData.data && checkData.data.status === 'completed') {
                isCompleted = true;
                try { eventSource.close(); } catch {}

                if (currentRunningAnalysis) {
                  currentRunningAnalysis.isCompleted = true;
                  currentRunningAnalysis.completedRecord = checkData.data;
                }

                finishRunningAnalysisUI(true);
                saveRecordToHistory(checkData.data);

                if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
                  updateProgressSnackbarCompleted(checkData.data);
                } else {
                  updateStageUI('Completed', 'Analysis complete! Redirecting...');
                  setTimeout(() => {
                    window.location.href = `/analysis/${encodeURIComponent(checkData.data.id)}`;
                  }, 400);
                }
                return;
              }
            }
          } catch {}
        }

        if (!isCompleted) {
          finishRunningAnalysisUI(false);
          const errMsg = 'Connection to analysis stream lost. Please check your network or try again.';
          if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
            updateProgressSnackbarFailed(errMsg);
          } else {
            showProgressError(errMsg);
          }
          try { eventSource.close(); } catch {}
        }
      };

      eventSource.addEventListener('error', () => {
        if (isCompleted) return;
        sseErrorCount++;

        // If the browser is still attempting native reconnect (readyState 0), allow it up to 5s before polling fallback
        if (eventSource && eventSource.readyState === 0 && sseErrorCount <= 2) {
          return;
        }

        // Trigger polling recovery to check if server completed or is completing the analysis
        attemptRecoveryPolling();
      });
    } catch (err) {
      // Fallback to standard POST endpoint
      console.warn('[GitEx] SSE not available or failed, falling back to POST /api/analyze:', err);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl, fresh: true }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Analysis failed.');
        }
        if (currentRunningAnalysis) {
          currentRunningAnalysis.isCompleted = true;
          currentRunningAnalysis.completedRecord = data.data;
        }
        saveRecordToHistory(data.data);
        if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
          updateProgressSnackbarCompleted(data.data);
        } else {
          window.location.href = `/analysis/${encodeURIComponent(data.data.id)}`;
        }
      } catch (postErr) {
        if (currentRunningAnalysis && currentRunningAnalysis.isDismissed) {
          updateProgressSnackbarFailed(postErr.message);
        } else {
          showProgressError(postErr.message);
        }
      }
    }
  }

  if (repoForm) {
    repoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (currentRunningAnalysis && !currentRunningAnalysis.isCompleted) {
        showValidationError('An analysis is already in progress in the background. Please wait for it to finish.');
        return;
      }

      if (isDailyQuotaExceeded()) {
        showQuotaModal();
        return;
      }

      const rawUrl = (urlInput ? urlInput.value : '').trim();
      if (!rawUrl) {
        showValidationError('Please enter a repository URL.');
        if (urlInput) urlInput.focus();
        return;
      }

      await startAnalysis(rawUrl);
    });
  }

  // -------------------------------------------------------------
  // Recent Analyses (LocalStorage Engine via GitExHistory)
  // -------------------------------------------------------------
  const historyContainer = document.getElementById('history-container');
  const historyCountEl = document.getElementById('history-count');
  const clearHistoryBtn = document.getElementById('btn-clear-history');

  function getHistory() {
    if (window.GitExHistory) {
      return window.GitExHistory.getAll();
    }
    try {
      const raw = localStorage.getItem('gitex_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveRecordToHistory(record) {
    if (!record) return;

    if (window.GitExHistory) {
      // 1. Explicitly purge temporary in-progress record if one exists
      if (currentRunningAnalysis && currentRunningAnalysis.tempId && currentRunningAnalysis.tempId !== record.id) {
        window.GitExHistory.delete(currentRunningAnalysis.tempId);
      }
      // 2. Explicitly purge any existing record with the same repository URL
      if (record.url) {
        window.GitExHistory.deleteByUrl(record.url);
      }
      window.GitExHistory.save(record);
    } else {
      let list = getHistory();
      const normalizeUrl = (u) => String(u || '').trim().toLowerCase().replace(/\.git$/i, '').replace(/\/+$/, '');
      const cleanNormUrl = normalizeUrl(record.url);

      list = list.filter((item) => {
        if (item.id === record.id) return false;
        if (currentRunningAnalysis && currentRunningAnalysis.tempId && item.id === currentRunningAnalysis.tempId) return false;
        if (cleanNormUrl && normalizeUrl(item.url) === cleanNormUrl) return false;
        return true;
      });
      list.unshift(record);
      try {
        localStorage.setItem('gitex_history', JSON.stringify(list));
      } catch {}
    }
    renderHistory();
    // Switch to history tab so user sees the newly analyzed repository
    if (typeof switchTab === 'function') {
      switchTab('history');
    }
  }

  async function deleteHistoryItem(id, url) {
    // 1. Delete from LocalStorage immediately
    if (window.GitExHistory) {
      window.GitExHistory.delete(id);
      if (url) window.GitExHistory.deleteByUrl(url);
    } else {
      let list = getHistory().filter(item => item.id !== id && (!url || item.url !== url));
      try {
        localStorage.setItem('gitex_history', JSON.stringify(list));
      } catch {}
    }
    renderHistory();

    // If history is now empty, automatically switch to #Trending tab
    if (getHistory().length === 0 && typeof switchTab === 'function') {
      switchTab('trending');
    }

    // 2. Notify server to delete cache for this record and URL
    try {
      const query = url ? `?url=${encodeURIComponent(url)}` : '';
      await fetch(`/api/analysis/${encodeURIComponent(id)}${query}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[GitEx] Failed to delete analysis from server cache:', err);
    }
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your local analysis history?')) {
        if (window.GitExHistory) {
          window.GitExHistory.clear();
        } else {
          try {
            localStorage.removeItem('gitex_history');
          } catch {}
        }
        renderHistory();

        // Switch to #Trending tab when history is cleared (0 items)
        if (typeof switchTab === 'function') {
          switchTab('trending');
        }

        // Also purge all cached analyses on server
        try {
          await fetch('/api/analysis/all', { method: 'DELETE' });
        } catch (err) {
          console.warn('[GitEx] Failed to purge server cache:', err);
        }
      }
    });
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  }

  function renderHistory() {
    if (!historyContainer) return;
    const items = getHistory();

    if (historyCountEl) {
      historyCountEl.textContent = String(items.length);
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.style.display = items.length > 0 ? 'inline-block' : 'none';
    }

    if (items.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history-card">
          <div class="empty-icon" aria-hidden="true">📋</div>
          <h3 class="empty-title">No repositories analyzed yet</h3>
          <p class="empty-desc">
            Enter a public repository URL above to generate an architecture breakdown, prerequisites, installation commands, and usage guide.
          </p>
          <div class="storage-notice">
            <span aria-hidden="true">🔒</span>
            <span>Analysis history is stored locally in this browser</span>
          </div>
        </div>
      `;
      return;
    }

    const listHtml = items.map((item) => {
      const fullName = item.fullName || (item.owner && item.name ? `${item.owner}/${item.name}` : item.name) || 'Repository';
      const provider = item.provider || 'git';
      const language = item.language || 'Unknown';
      const timeStr = formatRelativeTime(item.analyzedAt);
      const isGenerating = item.status === 'generating';

      return `
        <div class="history-item" data-id="${item.id}" data-url="${escapeHtml(item.url || '')}">
          <div class="history-main-info">
            <div class="history-repo-title">
              <span>${escapeHtml(fullName)}</span>
            </div>
            <div class="history-repo-meta">
              <span class="font-mono" style="text-transform: capitalize;">${escapeHtml(provider)}</span>
              <span>•</span>
              <span>${escapeHtml(language)}</span>
              ${timeStr && !isGenerating ? `<span>•</span><span>${escapeHtml(timeStr)}</span>` : ''}
              ${item.status === 'partial' ? '<span>•</span><span class="badge badge-amber" style="padding:0 4px;font-size:10px;">Partial</span>' : ''}
              ${isGenerating ? '<span>•</span><span class="badge badge-accent font-mono" style="padding:1px 6px;font-size:10px;display:inline-flex;align-items:center;gap:4px;"><span class="spinner-tiny" aria-hidden="true"></span><span>Generating</span></span>' : ''}
            </div>
          </div>
          <div class="history-actions">
            ${isGenerating ? `
              <button type="button" class="btn-action-small btn-generating" disabled aria-disabled="true" title="Analysis in progress...">
                <span class="spinner-small" aria-hidden="true"></span>
                <span>Generating...</span>
              </button>
            ` : `
              <button type="button" class="btn-action-small btn-view-history" data-id="${item.id}" aria-label="View analysis for ${escapeHtml(fullName)}">
                View Analysis
              </button>
            `}
            <button type="button" class="btn-remove-item" data-id="${item.id}" data-url="${escapeHtml(item.url || '')}" aria-label="Remove ${escapeHtml(fullName)} from history" title="Remove from history">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    historyContainer.innerHTML = `<div class="history-list">${listHtml}</div>`;

    // Attach remove handlers
    historyContainer.querySelectorAll('.btn-remove-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const url = btn.getAttribute('data-url');
        deleteHistoryItem(id, url);
      });
    });

    // Attach view handlers
    historyContainer.querySelectorAll('.btn-view-history').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.href = `/analysis/${encodeURIComponent(id)}`;
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------
  const toastEl = document.getElementById('gitex-toast');
  const toastMsg = document.getElementById('toast-message');
  let toastTimer = null;

  function showToast(message, duration = 3000) {
    if (!toastEl || !toastMsg) return;
    toastMsg.textContent = message;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }

  function formatCompactNumber(num) {
    if (typeof num !== 'number') return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return String(num);
  }

  // -------------------------------------------------------------
  // Dashboard Discovery & History Tabs (#Trending on GitHub)
  // -------------------------------------------------------------
  const tabBtnHistory = document.getElementById('tab-btn-history');
  const tabBtnTrending = document.getElementById('tab-btn-trending');
  const panelHistory = document.getElementById('panel-history');
  const panelTrending = document.getElementById('panel-trending');
  const trendingContainer = document.getElementById('trending-container');
  const periodPills = document.querySelectorAll('.trending-period-switcher .period-pill');

  let activeTab = 'history';
  let currentTrendingPeriod = 'today';
  const clientTrendingCache = {
    today: null,
    week: null,
    month: null,
  };

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'trending') {
      if (tabBtnTrending) {
        tabBtnTrending.classList.add('active');
        tabBtnTrending.setAttribute('aria-selected', 'true');
      }
      if (tabBtnHistory) {
        tabBtnHistory.classList.remove('active');
        tabBtnHistory.setAttribute('aria-selected', 'false');
      }
      if (panelTrending) panelTrending.style.display = 'block';
      if (panelHistory) panelHistory.style.display = 'none';
      if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
      loadTrending(currentTrendingPeriod);
    } else {
      if (tabBtnHistory) {
        tabBtnHistory.classList.add('active');
        tabBtnHistory.setAttribute('aria-selected', 'true');
      }
      if (tabBtnTrending) {
        tabBtnTrending.classList.remove('active');
        tabBtnTrending.setAttribute('aria-selected', 'false');
      }
      if (panelHistory) panelHistory.style.display = 'block';
      if (panelTrending) panelTrending.style.display = 'none';
      const historyItems = getHistory();
      if (clearHistoryBtn) {
        clearHistoryBtn.style.display = historyItems.length > 0 ? 'inline-block' : 'none';
      }
    }
  }

  if (tabBtnHistory) {
    tabBtnHistory.addEventListener('click', () => switchTab('history'));
  }
  if (tabBtnTrending) {
    tabBtnTrending.addEventListener('click', () => switchTab('trending'));
  }

  async function loadTrending(period = 'today', force = false) {
    currentTrendingPeriod = period;

    periodPills.forEach((btn) => {
      const p = btn.getAttribute('data-period');
      const isActive = (p === period);
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (!trendingContainer) return;

    if (!force && clientTrendingCache[period]) {
      renderTrendingList(clientTrendingCache[period]);
      return;
    }

    trendingContainer.innerHTML = `
      <div class="trending-loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <span>Loading top trending repositories...</span>
      </div>
    `;

    try {
      const res = await fetch(`/api/repository/trending?period=${encodeURIComponent(period)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        clientTrendingCache[period] = json.data;
        renderTrendingList(json.data);
      } else {
        throw new Error(json.error || 'Failed to load trending repositories');
      }
    } catch (err) {
      trendingContainer.innerHTML = `
        <div class="trending-error-state">
          <p>Failed to load trending repositories (${escapeHtml(err.message)}).</p>
          <button type="button" class="btn-action-small" id="btn-retry-trending">Retry</button>
        </div>
      `;
      const retryBtn = document.getElementById('btn-retry-trending');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => loadTrending(period, true));
      }
    }
  }

  function renderTrendingList(repos) {
    if (!trendingContainer) return;

    if (!Array.isArray(repos) || repos.length === 0) {
      trendingContainer.innerHTML = `
        <div class="empty-history-card">
          <p class="empty-desc">No trending repositories found for this period.</p>
        </div>
      `;
      return;
    }

    const itemsHtml = repos.slice(0, 5).map((repo, idx) => {
      const rank = idx + 1;
      const title = repo.fullName || repo.name || 'Repository';
      const desc = repo.description || 'No description provided.';
      const lang = repo.language || 'Unknown';
      const starsFormatted = formatCompactNumber(repo.stars || 0);
      const forksFormatted = formatCompactNumber(repo.forks || 0);
      const repoUrl = repo.url || `https://github.com/${title}`;

      return `
        <div class="trending-card" data-url="${escapeHtml(repoUrl)}">
          <div class="trending-left">
            <span class="trending-rank">#${rank}</span>
            <div class="trending-main">
              <div class="trending-repo-title-row">
                <a href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener noreferrer" class="trending-repo-title" title="Open ${escapeHtml(title)} on GitHub">
                  ${escapeHtml(title)}
                </a>
              </div>
              <p class="trending-repo-desc">${escapeHtml(desc)}</p>
              <div class="trending-meta-row">
                <span class="trending-lang-badge">${escapeHtml(lang)}</span>
                <span class="trending-stat-badge" title="${repo.stars || 0} stars">
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                  <span>${starsFormatted}</span>
                </span>
                <span class="trending-stat-badge" title="${repo.forks || 0} forks">
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 10a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path></svg>
                  <span>${forksFormatted}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="trending-actions">
            <button
              type="button"
              class="btn-copy-trending"
              data-url="${escapeHtml(repoUrl)}"
              aria-label="Copy URL for ${escapeHtml(title)}"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy URL</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    trendingContainer.innerHTML = `<div class="trending-list">${itemsHtml}</div>`;

    // Attach copy click listeners
    trendingContainer.querySelectorAll('.btn-copy-trending').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const urlToCopy = btn.getAttribute('data-url');
        if (!urlToCopy) return;

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(urlToCopy);
          } else {
            const textarea = document.createElement('textarea');
            textarea.value = urlToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }

          // Visual feedback on button
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Copied!</span>
          `;

          // Toast notification
          showToast('Repository URL copied to clipboard! Paste it above to explain.');

          // Focus on input bar
          if (urlInput) {
            urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            urlInput.focus();
          }

          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy URL</span>
            `;
          }, 2000);
        } catch (copyErr) {
          console.warn('[GitEx] Failed to copy URL:', copyErr);
          showToast('Failed to copy to clipboard.');
        }
      });
    });
  }

  // Hook up period switcher buttons
  periodPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-period');
      if (p) loadTrending(p);
    });
  });

  // Handle ?url=...&reanalyze=true from viewer or ?quota=exceeded
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('quota') === 'exceeded' || isDailyQuotaExceeded()) {
    if (urlParams.get('quota') === 'exceeded') {
      showQuotaModal();
    }
  }

  const reanalyzeUrl = urlParams.get('url');
  if (reanalyzeUrl && urlInput) {
    urlInput.value = reanalyzeUrl;
    const detected = detectProviderPreview(reanalyzeUrl);
    updateBadge(detected);
    if (urlParams.get('reanalyze') === 'true') {
      if (isDailyQuotaExceeded()) {
        showQuotaModal();
      } else {
        startAnalysis(reanalyzeUrl);
      }
    }
  }

  // Prune any stale / orphaned generating records from interrupted sessions
  function pruneStaleGeneratingRecords() {
    try {
      const items = getHistory();
      const staleItems = items.filter(item => item.status === 'generating');
      if (staleItems.length > 0) {
        if (window.GitExHistory) {
          staleItems.forEach(item => {
            window.GitExHistory.delete(item.id);
            if (item.url) window.GitExHistory.deleteByUrl(item.url);
          });
        } else {
          const cleaned = items.filter(item => item.status !== 'generating');
          localStorage.setItem('gitex_history', JSON.stringify(cleaned));
        }
      }
    } catch {}
  }

  pruneStaleGeneratingRecords();

  // Initial render of history and tab activation
  // Requirement: If recent analysis empty (0 items), only tab Trending should be active!
  const initialHistory = getHistory();
  renderHistory();

  if (initialHistory.length === 0) {
    switchTab('trending');
  } else {
    switchTab('history');
  }
})();
