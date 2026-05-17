(function() {
  const root = document.querySelector('[data-studio-root]');
  if (!root) return;

  const FRONT_MASK = root.dataset.modelTshirtFront;
  const BACK_MASK = root.dataset.modelTshirtBack;
  const FIXED_PRICE = root.dataset.fixedPrice || '899';
  const CURRENCY = root.dataset.currencySymbol || '₹';

  // Products JSON
  const productsEl = root.querySelector('[data-studio-products]');
  const PRODUCTS = productsEl ? JSON.parse(productsEl.textContent) : {};

  // DOM refs
  const frontCanvas = root.querySelector('[data-studio-canvas="front"]');
  const backCanvas = root.querySelector('[data-studio-canvas="back"]');
  const frontCtx = frontCanvas?.getContext('2d');
  const backCtx = backCanvas?.getContext('2d');
  const frontCard = root.querySelector('[data-studio-preview-card="front"]');
  const backCard = root.querySelector('[data-studio-preview-card="back"]');
  const garmentSelect = root.querySelector('[data-studio-garment]');
  const sizeSelect = root.querySelector('[data-studio-size]');
  const swatches = root.querySelectorAll('[data-studio-swatch]');
  const customColorPicker = root.querySelector('[data-studio-custom-color-picker]');
  const customColorHex = root.querySelector('[data-studio-custom-color-hex]');
  const customColorApply = root.querySelector('[data-studio-custom-color-apply]');
  const uploadInput = root.querySelector('[data-studio-upload]');
  const uploadTrigger = root.querySelector('[data-studio-upload-trigger]');
  const uploadName = root.querySelector('[data-studio-upload-name]');
  const placementSelect = root.querySelector('[data-studio-placement]');
  const editTabs = root.querySelectorAll('[data-studio-edit-side]');
  const resetBtn = root.querySelector('[data-studio-reset-side]');
  const submitBtn = root.querySelector('[data-studio-submit]');
  const priceDisplay = root.querySelector('[data-studio-price]');
  const statusEl = root.querySelector('[data-studio-status]');
  const form = root.querySelector('[data-studio-form]');

  // Readouts
  const garmentReadout = root.querySelector('[data-studio-garment-readout]');
  const sizeReadout = root.querySelector('[data-studio-size-readout]');
  const colorReadout = root.querySelector('[data-studio-color-readout]');
  const washReadout = root.querySelector('[data-studio-wash-readout]');
  const fileReadout = root.querySelector('[data-studio-file-readout]');

  // Hidden inputs
  const variantIdInput = root.querySelector('[data-studio-variant-id]');
  const sizeProperty = root.querySelector('[data-studio-size-property]');
  const colorProperty = root.querySelector('[data-studio-color-property]');
  const washProperty = root.querySelector('[data-studio-wash-property]');
  const colorSourceProperty = root.querySelector('[data-studio-color-source-property]');
  const customColorProperty = root.querySelector('[data-studio-custom-color-property]');
  const scaleProperty = root.querySelector('[data-studio-scale-property]');
  const artworkNameProperty = root.querySelector('[data-studio-artwork-name-property]');
  const frontTransformProperty = root.querySelector('[data-studio-front-transform-property]');
  const backTransformProperty = root.querySelector('[data-studio-back-transform-property]');

  // State
  let currentColor = root.dataset.defaultColor || '#828FB2';
  let currentColorName = root.dataset.defaultColorName || 'Acid Wash Blue';
  let currentWash = root.dataset.defaultWash || 'acid-blue';
  let currentGarment = 'tshirt';
  let activeSide = 'front';
  let artworkImg = null;
  let artworkTransforms = { front: { x: 0.3, y: 0.25, scale: 0.35 }, back: { x: 0.3, y: 0.25, scale: 0.35 } };
  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  let maskImages = { front: null, back: null };

  // Load mask images
  function loadMask(url) {
    return new Promise((resolve) => {
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
    const placement = placementSelect?.value || 'both';
    if (artworkImg && (placement === side || placement === 'both')) {
      const t = artworkTransforms[side];
      const aw = w * t.scale;
      const ah = (artworkImg.height / artworkImg.width) * aw;
      const ax = t.x * w;
      const ay = t.y * h;
      ctx.drawImage(artworkImg, ax, ay, aw, ah);

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

  // Populate size dropdown
  function populateSizes() {
    if (!sizeSelect) return;
    const product = PRODUCTS[currentGarment];
    if (!product) return;
    sizeSelect.innerHTML = '';
    product.variants.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.title;
      if (!v.available) opt.disabled = true;
      sizeSelect.appendChild(opt);
    });
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

  // Swatch selection
  function selectSwatch(el) {
    swatches.forEach(s => s.classList.remove('is-active'));
    el.classList.add('is-active');
    currentColor = el.dataset.color;
    currentColorName = el.dataset.colorName;
    currentWash = el.dataset.wash;
    if (colorProperty) colorProperty.value = currentColorName + ' (' + currentColor + ')';
    if (washProperty) washProperty.value = currentColorName;
    if (colorSourceProperty) colorSourceProperty.value = currentWash === 'solid' ? 'Solid swatch' : 'Acid swatch';
    if (customColorProperty) customColorProperty.value = '';
    if (colorReadout) colorReadout.textContent = currentColorName;
    if (washReadout) washReadout.textContent = currentColorName;
    renderBothCanvases();
  }

  // Canvas interaction (drag artwork)
  function getCanvasCoords(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  function setupCanvasInteraction(canvas, side) {
    if (!canvas) return;
    const onDown = (e) => {
      if (!artworkImg) return;
      e.preventDefault();
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      const aw = t.scale;
      const ah = (artworkImg.height / artworkImg.width) * aw;
      // Check resize handle
      if (pos.x >= t.x + aw - 0.03 && pos.y >= t.y + ah - 0.03) {
        isResizing = true;
      } else if (pos.x >= t.x && pos.x <= t.x + aw && pos.y >= t.y && pos.y <= t.y + ah) {
        isDragging = true;
      }
      dragStart = pos;
      activeSide = side;
      updateEditTabs();
    };
    const onMove = (e) => {
      if (!isDragging && !isResizing) return;
      e.preventDefault();
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      if (isDragging) {
        t.x += pos.x - dragStart.x;
        t.y += pos.y - dragStart.y;
      } else if (isResizing) {
        const dx = pos.x - dragStart.x;
        t.scale = Math.max(0.1, t.scale + dx);
      }
      dragStart = pos;
      renderBothCanvases();
      updateTransformProperties();
    };
    const onUp = () => { isDragging = false; isResizing = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
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
    renderBothCanvases();
  });

  sizeSelect?.addEventListener('change', () => {
    updateSizeReadout();
    updateVariantId();
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

  uploadTrigger?.addEventListener('click', () => uploadInput?.click());

  uploadInput?.addEventListener('change', () => {
    const file = uploadInput.files[0];
    if (!file) return;
    if (uploadName) uploadName.textContent = file.name;
    if (fileReadout) fileReadout.textContent = file.name;
    if (artworkNameProperty) artworkNameProperty.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        artworkImg = img;
        artworkTransforms = { front: { x: 0.3, y: 0.25, scale: 0.35 }, back: { x: 0.3, y: 0.25, scale: 0.35 } };
        renderBothCanvases();
        updateTransformProperties();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  placementSelect?.addEventListener('change', renderBothCanvases);

  editTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeSide = tab.dataset.studioEditSide;
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

  // Form submit with canvas snapshots
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Adding to cart...'; }
    if (statusEl) statusEl.textContent = 'Generating previews...';

    // Generate snapshots
    try {
      const frontBlob = await new Promise(r => frontCanvas.toBlob(r, 'image/png'));
      const backBlob = await new Promise(r => backCanvas.toBlob(r, 'image/png'));

      const formData = new FormData(form);
      if (frontBlob) formData.set('properties[Front Preview Snapshot]', frontBlob, 'front-preview.png');
      if (backBlob) formData.set('properties[Back Preview Snapshot]', backBlob, 'back-preview.png');

      if (statusEl) statusEl.textContent = 'Adding to cart...';

      const res = await fetch('/cart/add.js', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Cart error');

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
  if (priceDisplay) priceDisplay.textContent = CURRENCY + FIXED_PRICE;
  initMasks();
})();
