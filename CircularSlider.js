class CircularSlider {
    /**
     *
     * @param {string} container The container element's CSS selector
     * @param {object} sliders The list of sliders to draw
     */
    constructor({container, sliders}) {
        this.containerSelector = container;
        this.container = document.querySelector(this.containerSelector);
        this.width = 500;
        this.height = 500;
        this.sliders = sliders.map((slider, index) => ({
            ...slider,
            min: slider.min || 0,
            max: slider.max || 100,
            step: slider.step || 1,
            initialValue: slider.initialValue || 0,
            name: slider.name || 'N/A',
            color: slider.color || '#7bfff1',
            y: (index + 1) * 50 - 32,
            relFactor: slider.max / this.width,
        }));
        this.mouseDown = false;
        this.currentSlider = null;

        this.defaultSliderBgColor = '#888888'
        this.handleStrokeColor = '#ffffff';
        this.handleStrokeWidth = 5;
        this.sliderStrokeWidth = 15;
    }

    /**
     * Draw all sliders as configured in options
     */
    draw() {
        this.drawLegend();
        const wrapper = document.createElement('div');
        wrapper.classList.add('sliderWrapper');

        const svgElement = CircularSlider.createSvgElement('svg', {
            height: this.height, width: this.width,
        });

        wrapper.appendChild(svgElement);
        this.container.appendChild(wrapper);

        this.sliders.forEach((slider, i) => this.drawSlider(svgElement, slider, i));
        this.registerMouseEvents(wrapper);
    }

    /**
     * Draw individual slider
     *
     * @param {SVGElement} svgElement
     * @param {object} slider
     * @param {number} index
     */
    drawSlider(svgElement, slider, index) {
        const group = CircularSlider.createSvgElement('g', {'data-index': index});
        svgElement.appendChild(group);

        this.drawPath(slider, group);
        this.drawHandle(slider, group);
    }

    /**
     * Draw paths for slider
     *
     * @param {object} slider
     * @param group
     */
    drawPath(slider, group) {
        const path = CircularSlider.createSvgElement('path', {
            d: `M0,${slider.y} L${this.width},${slider.y}`
        });

        path.style.stroke = this.defaultSliderBgColor;
        path.style.strokeWidth = this.sliderStrokeWidth;

        group.appendChild(path);

        const coloredPath = CircularSlider.createSvgElement('path', {
            class: 'coloredPath',
            d: `M0,${slider.y} L${slider.initialValue / slider.relFactor},${slider.y}`
        });

        coloredPath.style.stroke = slider.color;
        coloredPath.style.strokeWidth = this.sliderStrokeWidth;

        group.appendChild(coloredPath);
    }

    /**
     * Draw handle
     *
     * @param {object} slider The slider to draw handle for
     * @param group  The slider group
     */
    drawHandle(slider, group) {
        const handle = CircularSlider.createSvgElement('circle', {
            class: 'handle',
            cx: slider.initialValue / slider.relFactor,
            cy: slider.y,
            r: 15,
            'data-min-value': slider.min,
            'data-max-value': slider.max,
            'data-step': slider.step,
        });

        handle.style.fill = slider.color;
        handle.style.stroke = this.handleStrokeColor;
        handle.style.strokeWidth = this.handleStrokeWidth;

        group.appendChild(handle);
    }

    /**
     * Draw legend box
     */
    drawLegend() {
        const legend = document.createElement('ul');
        legend.classList.add('legend');

        this.sliders.forEach((slider, index) => {
            const itemWrapper = document.createElement('li');
            const itemColor = document.createElement('div');
            const itemName = document.createElement('div');
            const itemValue = document.createElement('div');

            itemWrapper.setAttribute('data-index', index);

            itemColor.style.backgroundColor = slider.color;
            itemName.innerText = slider.name;
            itemValue.innerText = slider.initialValue;
            itemValue.classList.add('itemValue');

            itemWrapper.appendChild(itemColor);
            itemWrapper.appendChild(itemName);
            itemWrapper.appendChild(itemValue);

            legend.appendChild(itemWrapper);
        });

        this.container.appendChild(legend);
    }

    /**
     * Update slider on mouse interaction
     *
     * @param {{x: number, y: number}} mousePosition The coordinates of the current mouse position
     */
    updateSlider(mousePosition) {
        if (!this.currentSlider) return;

        const handle = this.currentSlider.querySelector('.handle');
        const handleY = parseFloat(handle.getAttribute('cy'));
        const min = parseFloat(handle.getAttribute('data-min-value'));
        const max = parseFloat(handle.getAttribute('data-max-value'));
        const step = parseFloat(handle.getAttribute('data-step'));

        let relFactor = max / this.width;
        let newX = mousePosition.x * relFactor;

        // Min value and step
        newX = Math.max(min, Math.min(newX, max));
        newX = Math.round((newX - min) / step) * step + min;

        const coloredPathEnd = newX / relFactor;
        handle.setAttribute('cx', coloredPathEnd);

        const coloredPath = this.currentSlider.querySelector('.coloredPath');
        const pathColor = handle.getAttribute('stroke');
        coloredPath.setAttribute('d', `M0,${handleY} L${coloredPathEnd},${handleY}`);
        coloredPath.setAttribute('stroke', pathColor);

        this.updateLegend(this.currentSlider.getAttribute('data-index'), newX)
    }

    /**
     * Update legend
     *
     * @param sliderIndex
     * @param value
     */
    updateLegend(sliderIndex, value) {
        const legendItem = this.container.querySelector(`.legend li[data-index="${sliderIndex}"] .itemValue`);
        legendItem.innerText = Math.round(value);
    }

    /**
     * Get the slider nearest to the current mouse position and set it as current
     *
     * @param {{x: number, y: number}} mousePosition
     */
    setCurrentSlider(mousePosition) {
        const wrapper = document.querySelector('.sliderWrapper');
        const groups = Array.from(wrapper.querySelectorAll('g'));

        const handlePositions = groups.map((group) => {
            const handle = group.querySelector('.handle');
            const handleY = parseFloat(handle.getAttribute('cy'));
            return Math.abs(handleY - mousePosition.y);
        });

        const nearest = handlePositions.indexOf(Math.min(...handlePositions));

        this.currentSlider = groups[nearest];
    }

    /**
     * Register mouse events
     *
     * @param DOMInteractionContainer
     */
    registerMouseEvents(DOMInteractionContainer) {
        DOMInteractionContainer.addEventListener('mousedown', this.handleMouseStart.bind(this), false);
        DOMInteractionContainer.addEventListener('touchstart', this.handleMouseStart.bind(this), false);
        DOMInteractionContainer.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        DOMInteractionContainer.addEventListener('touchmove', this.handleMouseMove.bind(this), false);
        window.addEventListener('mouseup', this.handleMouseEnd.bind(this), false);
        window.addEventListener('touchend', this.handleMouseEnd.bind(this), false);
    }

    /**
     * Handle mouse event
     *
     * @param event
     */
    handleMouseStart(event) {
        if (this.mouseDown) return;

        this.mouseDown = true;
        const mousePosition = CircularSlider.getMousePosition(event);
        this.setCurrentSlider(mousePosition);
        this.updateSlider(mousePosition);
    }

    /**
     * Handle mouse event
     *
     * @param event
     */
    handleMouseMove(event) {
        if (!this.mouseDown || !this.currentSlider) return;

        event.preventDefault();
        const mousePosition = CircularSlider.getMousePosition(event);
        this.updateSlider(mousePosition);
    }

    /**
     * Handle mouse event
     */
    handleMouseEnd() {
        if (!this.mouseDown) return;

        this.mouseDown = false;
        this.currentSlider = null;
    }

    /**
     * Get mouse position relative to the SVG wrapper
     *
     * @param event
     * @returns {{x: number, y: number}}
     */
    static getMousePosition(event) {
        const wrapper = document.querySelector('.sliderWrapper').getBoundingClientRect();
        let x, y, mouseX, mouseY;

        if (window.TouchEvent && event instanceof TouchEvent) {
            mouseX = event.touches[0].pageX;
            mouseY = event.touches[0].pageY;
        } else {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }

        x = mouseX - wrapper.left;
        y = mouseY - wrapper.top;

        return {x, y};
    }

    /**
     * Create an SVG element with optional attributes
     *
     * @param {string} ns The namespace
     * @param {object} attributes The attributes to set
     * @returns {SVGElement}
     */
    static createSvgElement(ns, attributes = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', ns);

        for (const [key, val] of Object.entries(attributes)) {
            el.setAttribute(key, val);
        }

        return el;
    }
}