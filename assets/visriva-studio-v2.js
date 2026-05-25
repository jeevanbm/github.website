(function() {
  const root = /** @type {HTMLElement | null} */ (document.querySelector('[data-studio-root]'));
  if (!root) return;

  const FRONT_MASK = root.dataset.modelTshirtFront;
  const BACK_MASK = root.dataset.modelTshirtBack;
  const FIXED_PRICE = root.dataset.fixedPrice || '899';
  const CURRENCY = root.dataset.currencySymbol || '₹';

  // Products JSON
  const productsEl = root.querySelector('[data-studio-products]');
  const PRODUCTS = productsEl ? JSON.parse(productsEl.textContent || '{}') : {};

  // DOM refs
  const frontCanvas = /** @type {HTMLCanvasElement | null} */ (root.querySelector('[data-studio-canvas="front"]'));
  const backCanvas = /** @type {HTMLCanvasElement | null} */ (root.querySelector('[data-studio-canvas="back"]'));
  const frontCtx = frontCanvas ? frontCanvas.getContext('2d') : null;
  const backCtx = backCanvas ? backCanvas.getContext('2d') : null;
  const frontCard = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-preview-card="front"]'));
  const backCard = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-preview-card="back"]'));
  const garmentSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-garment]'));
  const materialSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-material]'));
  const gsmSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-gsm]'));
  const materialWrapper = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-material-wrapper]'));
  const gsmWrapper = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-gsm-wrapper]'));
  const sizeSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-size]'));
  const defaultSwatchesContainer = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-swatches-container="default"]'));
  const hoodieSwatchesContainer = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-swatches-container="hoodie"]'));
  const swatches = /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll('[data-studio-swatch]'));
  const customColorPicker = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-picker]'));
  const customColorHex = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-hex]'));
  const customColorApply = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-custom-color-apply]'));
  const uploadInputFront = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-upload-front]'));
  const uploadTriggerFront = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-trigger-front]'));
  const uploadNameFront = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-name-front]'));

  const uploadInputBack = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-upload-back]'));
  const uploadTriggerBack = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-trigger-back]'));
  const uploadNameBack = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-name-back]'));

  const placementSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-placement]'));
  const editTabs = /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll('[data-studio-edit-side]'));
  const resetBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-reset-side]'));
  const submitBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-submit]'));
  const priceDisplay = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-price]'));
  const statusEl = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-status]'));
  const form = /** @type {HTMLFormElement | null} */ (root.querySelector('[data-studio-form]'));

  // Readouts
  const garmentReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-garment-readout]'));
  const sizeReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-size-readout]'));
  const gsmReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-gsm-readout]'));
  const materialReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-material-readout]'));
  const colorReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-color-readout]'));
  const washReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-wash-readout]'));
  const fileReadoutFront = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-file-readout-front]'));
  const fileReadoutBack = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-file-readout-back]'));

  // Hidden inputs
  const variantIdInput = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-variant-id]'));
  const sizeProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-size-property]'));
  const gsmProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-gsm-property]'));
  const materialProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-material-property]'));
  const colorProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-color-property]'));
  const washProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-wash-property]'));
  const colorSourceProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-color-source-property]'));
  const customColorProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-property]'));
  const scaleProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-scale-property]'));
  const artworkFrontNameProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-artwork-front-name-property]'));
  const artworkBackNameProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-artwork-back-name-property]'));
  const frontTransformProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-front-transform-property]'));
  const backTransformProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-back-transform-property]'));

  // State
  let currentColor = root.dataset.defaultColor || '#828FB2';
  let currentColorName = root.dataset.defaultColorName || 'Acid Wash Blue';
  let currentWash = root.dataset.defaultWash || 'acid-blue';
  let currentGarment = 'tshirt';
  /** @type {'front' | 'back'} */
  let activeSide = 'front';
  /** @type {Record<'front' | 'back', HTMLImageElement | null>} */
  let artworkImages = { front: null, back: null };
  /** @type {Record<'front' | 'back', { x: number, y: number, scale: number }>} */
  let artworkTransforms = { front: { x: 0.3, y: 0.25, scale: 0.35 }, back: { x: 0.3, y: 0.25, scale: 0.35 } };
  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  /** @type {{ front: HTMLImageElement | null, back: HTMLImageElement | null }} */
  let maskImages = { front: null, back: null };

  // Load mask images
  /**
   * @param {string | undefined} url
   * @returns {Promise<HTMLImageElement | null>}
   */
  function loadMask(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function initMasks() {
    maskImages.front = await loadMask(FRONT_MASK);
    maskImages.back = await loadMask(BACK_MASK);
    renderBothCanvases();
  }

  // Render canvas
  /**
   * @param {CanvasRenderingContext2D | null} ctx
   * @param {HTMLCanvasElement | null} canvas
   * @param {'front' | 'back'} side
   */
  function renderCanvas(ctx, canvas, side) {
    if (!ctx || !canvas) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background color fill
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, w, h);

    // Mask overlay
    const mask = maskImages[side];
    if (mask) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Artwork
    const img = artworkImages[side];
    const placement = placementSelect?.value || 'both';
    if (img && (placement === side || placement === 'both')) {
      const t = artworkTransforms[side];
      const aw = w * t.scale;
      const ah = (img.height / img.width) * aw;
      const ax = t.x * w;
      const ay = t.y * h;
      ctx.drawImage(img, ax, ay, aw, ah);

      // Draw resize handle if active
      if (activeSide === side) {
        ctx.strokeStyle = 'rgba(252,246,186,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(ax, ay, aw, ah);
        ctx.setLineDash([]);
        // Corner handle
        ctx.fillStyle = '#fcf6ba';
        ctx.fillRect(ax + aw - 6, ay + ah - 6, 12, 12);
      }
    }
  }

  function renderBothCanvases() {
    renderCanvas(frontCtx, frontCanvas, 'front');
    renderCanvas(backCtx, backCanvas, 'back');
  }

  // Populate size dropdown and size button cards
  function populateSizes() {
    if (!sizeSelect) return;
    const product = PRODUCTS[currentGarment];
    if (!product) return;
    
    // Clear select
    sizeSelect.innerHTML = '';
    
    // Clear visible size button container if it exists
    const sizesContainer = root?.querySelector('[data-studio-sizes-container]');
    if (sizesContainer) sizesContainer.innerHTML = '';
    
    product.variants.forEach((/** @type {any} */ v, /** @type {number} */ index) => {
      // 1. Add to the hidden select
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.title;
      if (!v.available) opt.disabled = true;
      sizeSelect.appendChild(opt);
      
      // 2. Add a visible premium button card
      if (sizesContainer) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'studio-v2-size-card';
        if (!v.available) {
          btn.classList.add('is-sold-out');
          btn.disabled = true;
        }
        
        // Extract size title (e.g., "S" from "S / 430 GSM")
        const rawTitle = v.title || '';
        const displayTitle = rawTitle.split('/')[0].trim();
        
        btn.innerHTML = `
          <span class="studio-v2-size-title">${displayTitle}</span>
          ${v.available ? '' : '<span class="studio-v2-size-badge">Sold Out</span>'}
        `;
        
        btn.setAttribute('aria-label', `Size ${v.title}`);
        
        // Event listener for button click
        btn.addEventListener('click', () => {
          if (!v.available) return;
          
          // Select this option in the hidden select
          sizeSelect.value = v.id;
          
          // Trigger change event to fire existing listeners
          sizeSelect.dispatchEvent(new Event('change'));
        });
        
        sizesContainer.appendChild(btn);
      }
    });
    
    // Auto-select the first available variant on load
    if (sizesContainer) {
      const activeVariant = product.variants.find((/** @type {any} */ v) => v.available);
      if (activeVariant) {
        sizeSelect.value = activeVariant.id;
        const index = product.variants.findIndex((/** @type {any} */ v) => v.id === activeVariant.id);
        const buttons = sizesContainer.querySelectorAll('.studio-v2-size-card');
        if (buttons[index]) {
          buttons[index].classList.add('is-active');
        }
      }
    }
    
    updateSizeReadout();
    updateVariantId();
  }

  function updateVariantId() {
    if (variantIdInput && sizeSelect) variantIdInput.value = sizeSelect.value;
  }

  function updateSizeReadout() {
    if (sizeReadout && sizeSelect) {
      const opt = sizeSelect.options[sizeSelect.selectedIndex];
      sizeReadout.textContent = opt ? opt.textContent : 'Not selected';
    }
    if (sizeProperty && sizeSelect) {
      const opt = sizeSelect.options[sizeSelect.selectedIndex];
      sizeProperty.value = opt ? opt.textContent : '';
    }
  }

  function updateConditionalFields() {
    const garment = currentGarment;
    /** @type {string[]} */
    let gsmOptions = [];
    const isHoodie = garment === 'hoodie';
    
    if (garment === 'tshirt') {
      gsmOptions = ['180 GSM', '220 GSM', '240 GSM'];
      if (materialWrapper) materialWrapper.style.display = 'block';
      if (gsmWrapper) gsmWrapper.style.display = 'block';
    } else if (garment === 'hoodie') {
      gsmOptions = ['300 GSM', '350 GSM', '400 GSM'];
      if (materialWrapper) materialWrapper.style.display = 'none';
      if (gsmWrapper) gsmWrapper.style.display = 'block';
    } else if (garment === 'polo') {
      gsmOptions = ['160 GSM', '200 GSM', '240 GSM'];
      if (materialWrapper) materialWrapper.style.display = 'block';
      if (gsmWrapper) gsmWrapper.style.display = 'block';
    } else if (garment === 'sweatshirt') {
      gsmOptions = ['280 GSM', '320 GSM', '360 GSM'];
      if (materialWrapper) materialWrapper.style.display = 'none';
      if (gsmWrapper) gsmWrapper.style.display = 'block';
    }

    if (defaultSwatchesContainer) defaultSwatchesContainer.style.display = isHoodie ? 'none' : 'block';
    if (hoodieSwatchesContainer) hoodieSwatchesContainer.style.display = isHoodie ? 'block' : 'none';

    // Auto-select first visible swatch if the currently active swatch is now hidden
    const activeContainer = isHoodie ? hoodieSwatchesContainer : defaultSwatchesContainer;
    if (activeContainer) {
       const activeSwatchInContainer = activeContainer.querySelector('.is-active');
       if (!activeSwatchInContainer) {
         const firstSwatch = activeContainer.querySelector('[data-studio-swatch]');
         if (firstSwatch) selectSwatch(firstSwatch);
       }
    }

    if (gsmSelect) {
      // Preserve current selection if it exists in the new options
      const currentSelection = gsmSelect.value;
      gsmSelect.innerHTML = gsmOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
      if (gsmOptions.includes(currentSelection)) {
        gsmSelect.value = currentSelection;
      }
    }

    updateGsmAndMaterialReadouts();
  }

  function updateGsmAndMaterialReadouts() {
    if (gsmSelect && gsmProperty) gsmProperty.value = gsmWrapper?.style.display !== 'none' ? gsmSelect.value : '';
    if (materialSelect && materialProperty) materialProperty.value = materialWrapper?.style.display !== 'none' ? materialSelect.value : '';
    
    if (gsmSelect && gsmReadout) {
      gsmReadout.textContent = gsmWrapper?.style.display !== 'none' ? gsmSelect.value || 'Not selected' : 'N/A';
    }
    if (materialSelect && materialReadout) {
      materialReadout.textContent = materialWrapper?.style.display !== 'none' ? materialSelect.value || 'Not selected' : 'N/A';
    }
  }

  // Swatch selection
  /**
   * @param {HTMLElement} el
   */
  function selectSwatch(el) {
    swatches.forEach(s => s.classList.remove('is-active'));
    el.classList.add('is-active');
    currentColor = el.dataset.color || '#828FB2';
    currentColorName = el.dataset.colorName || 'Acid Wash Blue';
    currentWash = el.dataset.wash || 'acid-blue';
    if (colorProperty) colorProperty.value = currentColorName + ' (' + currentColor + ')';
    if (washProperty) washProperty.value = currentColorName;
    if (colorSourceProperty) colorSourceProperty.value = currentWash === 'solid' ? 'Solid swatch' : 'Acid swatch';
    if (customColorProperty) customColorProperty.value = '';
    if (colorReadout) colorReadout.textContent = currentColorName;
    if (washReadout) washReadout.textContent = currentColorName;
    renderBothCanvases();
  }

  // Canvas interaction (drag and resize artwork)
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {any} e
   * @returns {{ x: number, y: number }}
   */
  function getCanvasCoords(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  /**
   * @param {HTMLCanvasElement | null} canvas
   * @param {'front' | 'back'} side
   */
  function setupCanvasInteraction(canvas, side) {
    if (!canvas) return;

    const onDown = (/** @type {any} */ e) => {
      const img = artworkImages[side];
      if (!img) return;
      
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      
      // Calculate mathematically correct aspect-ratio adjusted height (normalized)
      const aspect = img.height / img.width;
      const aw = t.scale;
      const ah = aspect * aw * (canvas.width / canvas.height);
      
      // Calculate distance to the bottom-right corner (resize handle)
      const distToCornerX = Math.abs(pos.x - (t.x + aw));
      const distToCornerY = Math.abs(pos.y - (t.y + ah));
      
      // Check if we hit the resize handle (within a 0.05 hit-box radius)
      if (distToCornerX <= 0.05 && distToCornerY <= 0.05) {
        isResizing = true;
        e.preventDefault();
      } 
      // Otherwise check if we clicked inside the artwork bounding box to drag
      else if (pos.x >= t.x && pos.x <= t.x + aw && pos.y >= t.y && pos.y <= t.y + ah) {
        isDragging = true;
        e.preventDefault();
      } 
      // Clicked outside, allow normal event bubbling
      else {
        return; 
      }

      dragStart = pos;
      activeSide = side;
      updateEditTabs();

      // Bind window event listeners for high-precision pointer tracking even outside canvas boundaries
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    };

    const onMove = (/** @type {any} */ e) => {
      if (!isDragging && !isResizing) return;
      e.preventDefault();
      
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      if (isDragging) {
        t.x += dx;
        t.y += dy;
      } else if (isResizing) {
        // Adjust scale smoothly
        t.scale = Math.max(0.05, Math.min(1.0, t.scale + dx));
      }

      dragStart = pos;
      renderBothCanvases();
      updateTransformProperties();
    };

    const onUp = () => {
      isDragging = false;
      isResizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
  }

  function updateTransformProperties() {
    if (frontTransformProperty) frontTransformProperty.value = JSON.stringify(artworkTransforms.front);
    if (backTransformProperty) backTransformProperty.value = JSON.stringify(artworkTransforms.back);
  }

  function updateEditTabs() {
    editTabs.forEach(t => {
      t.classList.toggle('is-active', t.dataset.studioEditSide === activeSide);
    });
    frontCard?.classList.toggle('is-active', activeSide === 'front');
    backCard?.classList.toggle('is-active', activeSide === 'back');
    renderBothCanvases();
  }

  // Event listeners
  garmentSelect?.addEventListener('change', () => {
    currentGarment = garmentSelect.value;
    if (garmentReadout) garmentReadout.textContent = PRODUCTS[currentGarment]?.label || currentGarment;
    populateSizes();
    updateConditionalFields();
    renderBothCanvases();
  });

  gsmSelect?.addEventListener('change', updateGsmAndMaterialReadouts);
  materialSelect?.addEventListener('change', updateGsmAndMaterialReadouts);

  sizeSelect?.addEventListener('change', () => {
    updateSizeReadout();
    updateVariantId();
    
    // Synchronize visible size card button active classes
    const sizesContainer = root.querySelector('[data-studio-sizes-container]');
    if (sizesContainer && sizeSelect) {
      const activeId = sizeSelect.value;
      const optionsArray = Array.from(sizeSelect.options);
      const index = optionsArray.findIndex(opt => opt.value === activeId);
      const buttons = sizesContainer.querySelectorAll('.studio-v2-size-card');
      buttons.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === index);
      });
    }
  });

  swatches.forEach(s => s.addEventListener('click', () => selectSwatch(s)));

  customColorPicker?.addEventListener('input', () => {
    if (customColorHex) customColorHex.value = customColorPicker.value;
  });

  customColorApply?.addEventListener('click', () => {
    const hex = customColorHex?.value || customColorPicker?.value;
    if (!hex) return;
    swatches.forEach(s => s.classList.remove('is-active'));
    currentColor = hex;
    currentColorName = 'Custom (' + hex + ')';
    currentWash = 'custom';
    if (colorProperty) colorProperty.value = currentColorName;
    if (washProperty) washProperty.value = 'Custom';
    if (colorSourceProperty) colorSourceProperty.value = 'Custom picker';
    if (customColorProperty) customColorProperty.value = hex;
    if (colorReadout) colorReadout.textContent = currentColorName;
    if (washReadout) washReadout.textContent = 'Custom';
    renderBothCanvases();
  });

  // Handle front upload
  uploadTriggerFront?.addEventListener('click', () => uploadInputFront?.click());
  uploadInputFront?.addEventListener('change', () => {
    const file = uploadInputFront.files ? uploadInputFront.files[0] : null;
    if (!file) return;
    if (uploadNameFront) uploadNameFront.textContent = file.name;
    if (fileReadoutFront) fileReadoutFront.textContent = file.name;
    if (artworkFrontNameProperty) artworkFrontNameProperty.value = file.name;
    const reader = new FileReader();
    reader.onload = (/** @type {any} */ e) => {
      const img = new Image();
      img.onload = () => {
        artworkImages.front = img;
        artworkTransforms.front = { x: 0.3, y: 0.25, scale: 0.35 };
        renderBothCanvases();
        updateTransformProperties();
      };
      if (e.target && typeof e.target.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });

  // Handle back upload
  uploadTriggerBack?.addEventListener('click', () => uploadInputBack?.click());
  uploadInputBack?.addEventListener('change', () => {
    const file = uploadInputBack.files ? uploadInputBack.files[0] : null;
    if (!file) return;
    if (uploadNameBack) uploadNameBack.textContent = file.name;
    if (fileReadoutBack) fileReadoutBack.textContent = file.name;
    if (artworkBackNameProperty) artworkBackNameProperty.value = file.name;
    const reader = new FileReader();
    reader.onload = (/** @type {any} */ e) => {
      const img = new Image();
      img.onload = () => {
        artworkImages.back = img;
        artworkTransforms.back = { x: 0.3, y: 0.25, scale: 0.35 };
        renderBothCanvases();
        updateTransformProperties();
      };
      if (e.target && typeof e.target.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });

  placementSelect?.addEventListener('change', renderBothCanvases);

  editTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeSide = /** @type {'front' | 'back'} */ (tab.dataset.studioEditSide || 'front');
      updateEditTabs();
    });
  });

  resetBtn?.addEventListener('click', () => {
    artworkTransforms[activeSide] = { x: 0.3, y: 0.25, scale: 0.35 };
    renderBothCanvases();
    updateTransformProperties();
  });

  frontCard?.addEventListener('click', () => { activeSide = 'front'; updateEditTabs(); });
  backCard?.addEventListener('click', () => { activeSide = 'back'; updateEditTabs(); });

  /**
   * Helper to convert Blob to Base64
   * @param {Blob | null} blob
   * @returns {Promise<string>}
   */
  function blobToBase64(blob) {
    return new Promise((resolve) => {
      if (!blob) { resolve(''); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = /** @type {string} */ (reader.result);
        resolve(result.split(',')[1] || '');
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper to upload file via serverless upload API
   * @param {Blob | null} blob
   * @param {string} filename
   * @param {string} mimeType
   * @returns {Promise<string>}
   */
  async function uploadToDriveAPI(blob, filename, mimeType) {
    if (!blob) return '';
    try {
      const base64Data = await blobToBase64(blob);
      // We query local host for local testing/saving, falling back dynamically
      const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api/upload-to-drive'
        : 'https://visriva-upload-api.vercel.app/api/upload-to-drive'; // Replace with production URL once deployed
        
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, mimeType, base64Data })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.publicUrl || '';
    } catch (e) {
      console.warn('API upload failed:', e);
      return '';
    }
  }

  // Form submit with canvas snapshots
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form) return;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading files...'; }
    if (statusEl) statusEl.textContent = 'Generating design previews...';

    try {
      // 1. Generate canvas snapshots
      const frontBlob = frontCanvas ? await new Promise(r => frontCanvas.toBlob(r, 'image/png')) : null;
      const backBlob = backCanvas ? await new Promise(r => backCanvas.toBlob(r, 'image/png')) : null;

      if (statusEl) statusEl.textContent = 'Uploading files to your synced folder...';

      // 2. Upload Front & Back snapshots
      const frontCloudUrl = await uploadToDriveAPI(frontBlob, 'front-preview.png', 'image/png');
      const backCloudUrl = await uploadToDriveAPI(backBlob, 'back-preview.png', 'image/png');

      // 3. Upload original high-res custom artwork if present
      let frontArtworkCloudUrl = '';
      let backArtworkCloudUrl = '';
      const originalFrontFile = uploadInputFront?.files ? uploadInputFront.files[0] : null;
      const originalBackFile = uploadInputBack?.files ? uploadInputBack.files[0] : null;

      if (originalFrontFile) {
        if (statusEl) statusEl.textContent = 'Uploading original front artwork...';
        frontArtworkCloudUrl = await uploadToDriveAPI(originalFrontFile, originalFrontFile.name, originalFrontFile.type);
      }
      if (originalBackFile) {
        if (statusEl) statusEl.textContent = 'Uploading original back artwork...';
        backArtworkCloudUrl = await uploadToDriveAPI(originalBackFile, originalBackFile.name, originalBackFile.type);
      }

      // 4. Inject cloud URLs into Shopify line item properties, falling back to direct binary attachments if uploader is offline
      const formData = new FormData(form);

      // Handle front preview snapshot
      if (frontCloudUrl) {
        formData.set('properties[Front Preview Snapshot]', frontCloudUrl);
        if (frontTransformProperty) formData.set('properties[Front Preview Cloud URL]', frontCloudUrl);
      } else if (frontBlob) {
        // Fallback: Upload the image blob directly to Shopify as a file
        formData.set('properties[Front Preview Snapshot]', frontBlob, 'front-preview.png');
      } else {
        formData.delete('properties[Front Preview Snapshot]');
      }

      // Handle back preview snapshot
      if (backCloudUrl) {
        formData.set('properties[Back Preview Snapshot]', backCloudUrl);
        if (backTransformProperty) formData.set('properties[Back Preview Cloud URL]', backCloudUrl);
      } else if (backBlob) {
        // Fallback: Upload the image blob directly to Shopify as a file
        formData.set('properties[Back Preview Snapshot]', backBlob, 'back-preview.png');
      } else {
        formData.delete('properties[Back Preview Snapshot]');
      }

      // Handle original front uploaded artwork
      if (frontArtworkCloudUrl) {
        formData.set('properties[Original Front Artwork Cloud URL]', frontArtworkCloudUrl);
        formData.delete('properties[Uploaded Front Artwork]');
      } else if (originalFrontFile) {
        formData.set('properties[Uploaded Front Artwork]', originalFrontFile, originalFrontFile.name);
      } else {
        formData.delete('properties[Uploaded Front Artwork]');
      }

      // Handle original back uploaded artwork
      if (backArtworkCloudUrl) {
        formData.set('properties[Original Back Artwork Cloud URL]', backArtworkCloudUrl);
        formData.delete('properties[Uploaded Back Artwork]');
      } else if (originalBackFile) {
        formData.set('properties[Uploaded Back Artwork]', originalBackFile, originalBackFile.name);
      } else {
        formData.delete('properties[Uploaded Back Artwork]');
      }

      // Delete any other empty File objects to prevent Shopify cart errors (e.g. from empty inputs)
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size === 0) {
          formData.delete(key);
        }
      }

      if (statusEl) statusEl.textContent = 'Adding to cart...';

      const res = await fetch('/cart/add.js', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Shopify Add to Cart Error response:', errorText);
        throw new Error('Cart error: ' + errorText);
      }

      // Track via Shopify analytics
      if (window.Shopify?.analytics?.publish) {
        window.Shopify.analytics.publish('designer_funnel_progress', { step: 'Added_To_Cart' });
      }

      window.location.href = '/cart';
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = 'Error adding to cart. Please try again.';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Add to cart - ' + CURRENCY + FIXED_PRICE; }
    }
  });

  // Setup canvas interactions
  setupCanvasInteraction(frontCanvas, 'front');
  setupCanvasInteraction(backCanvas, 'back');

  // Initialize
  populateSizes();
  updateConditionalFields();
  if (priceDisplay) priceDisplay.textContent = CURRENCY + FIXED_PRICE;
  initMasks();
})();
