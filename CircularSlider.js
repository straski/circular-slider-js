class CircularSlider {
    /**
     * @param {string} container The container element's CSS selector
     * @param {array} sliders The list of sliders to draw
     */
    constructor({ container, sliders }) {
        this.containerSelector = container;
        this.container = document.querySelector(this.containerSelector);
        this.width = 500;
        this.height = 500;
        this.sliders = sliders.map((slider) => ({
            ...slider,
            min: slider.min || 0,
            max: slider.max || 100,
            step: slider.step || 1,
            name: slider.name || 'N/A',
            color: slider.color || '#7bfff1',
            radius: slider.radius || 40,
            initialValue: slider.initialValue || 0,
            initialAngle: Math.floor((slider.initialValue / (slider.max - slider.min)) * 360),
        }));

        this.mouseDown = false;
        this.currentSlider = null;

        this.defaultSliderBgColor = '#888888';
        this.handleStrokeColor = '#ffffff';
        this.handleStrokeWidth = 5;

        this.cx = this.width / 2;
        this.cy = this.height / 2;

        this.pathSegmentSpacing = 0.9;
        this.pathSegmentLength = 10;
        this.pathSegmentWidth = 25;
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
        const circumference = slider.radius * 2 * Math.PI;
        const segmentSpacing = this.getSegmentSpacing(circumference);
        const group = CircularSlider.createSvgElement('g', {
            'data-index': index,
            class: 'path',
            transform: `rotate(-90,${this.cx},${this.cy})`,
            rad: slider.radius,
        });
        svgElement.appendChild(group);

        this.drawPath(slider, group, 0, segmentSpacing);
        this.drawPath(slider, group, 1, segmentSpacing);
        this.drawHandle(slider, group);
    }

    /**
     * Draw path for slider
     *
     * @param {object} slider
     * @param group
     * @param {number} part
     * @param {number} spacing
     */
    drawPath(slider, group, part, spacing) {
        const pathClass = (part === 0) ? 'path' : 'coloredPath';
        const pathColor = (part === 0) ? this.defaultSliderBgColor : slider.color;
        const angle = (part === 0) ? 360 : slider.initialAngle;

        const path = CircularSlider.createSvgElement('path', {
            class: pathClass,
            d: this.describeArc(0, angle, slider.radius),
        });

        path.style.stroke = pathColor;
        path.style.strokeWidth = this.pathSegmentWidth;
        path.setAttribute('stroke-dasharray', `${this.pathSegmentLength} ${spacing}`);
        path.style.fill = 'none';

        group.appendChild(path);
    }

    /**
     * Draw handle
     *
     * @param slider The slider to draw handle for
     * @param group  The slider group
     */
    drawHandle(slider, group) {
        const center = this.getHandleCenter(
            slider.initialAngle * (2 * Math.PI) / 360,
            slider.radius,
        );

        const handle = CircularSlider.createSvgElement('circle', {
            class: 'handle',
            cx: center.x,
            cy: center.y,
            r: 20,
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

        const radius = +this.currentSlider.getAttribute('rad');
        const angle = this.getMouseAngle(mousePosition) * 0.99;
        const handle = this.currentSlider.querySelector('.handle');

        const handleCenter = this.getHandleCenter(angle, radius);
        handle.setAttribute('cx', handleCenter.x);
        handle.setAttribute('cy', handleCenter.y);

        const path = this.currentSlider.querySelector('.coloredPath');
        const pathColor = handle.getAttribute('stroke');
        path.setAttribute('d', this.describeArc(0, CircularSlider.radiansToDegrees(angle), radius));
        path.setAttribute('stroke', pathColor);

        this.updateLegend(angle);
    }

    /**
     * Update legend
     *
     * @param {number} angle
     */
    updateLegend(angle) {
        const sliderIndex = this.currentSlider.getAttribute('data-index');
        const legend = document.querySelector(`li[data-index="${sliderIndex}"] .itemValue`);
        const slider = this.sliders[sliderIndex];
        const range = slider.max - slider.min;
        let value = angle / (2 * Math.PI) * range;
        const steps = Math.round(value / slider.step);
        value = slider.min + steps * slider.step;
        legend.innerText = value;
    }

    /**
     * Get the slider nearest to the current mouse position and set it as current
     *
     * @param {{x: number, y: number}} mousePosition
     */
    setCurrentSlider(mousePosition) {
        const wrapper = document.querySelector('.sliderWrapper');
        const groups = Array.from(wrapper.querySelectorAll('g'));
        const distance = Math.hypot(
            mousePosition.x - this.cx,
            mousePosition.y - this.cy,
        );
        const handlePositions = groups.map((slider) => {
            const rad = parseInt(slider.getAttribute('rad'));
            return Math.min(Math.abs(distance - rad));
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
     * Get center point of handle element
     *
     * @param {number} angle
     * @param {number} radius
     * @returns {{x: *, y: *}}
     */
    getHandleCenter(angle, radius) {
        const x = this.cx + Math.cos(angle) * radius;
        const y = this.cy + Math.sin(angle) * radius;
        return { x, y };
    }

    /**
     * Get mouse angle
     *
     * @param {{x: number, y: number}} mouseCoordinates
     * @returns {number}
     */
    getMouseAngle(mouseCoordinates) {
        const angle = Math.atan2(
            mouseCoordinates.y - this.cy,
            mouseCoordinates.x - this.cx,
        );

        return (angle > -(2 * Math.PI) / 2 && angle < -(2 * Math.PI) / 4)
            ? angle + (2 * Math.PI) * 1.25
            : angle + (2 * Math.PI) * 0.25;
    }

    /**
     * Describe the arc definition (d)
     *
     * @see https://stackoverflow.com/a/62080606
     * @param {number} radius
     * @param {number} startAngle
     * @param {number} endAngle
     * @returns {string}
     */
    describeArc(startAngle, endAngle, radius) {
        const _endAngle = endAngle;

        endAngle = (_endAngle - startAngle === 360) ? 359 : endAngle;

        const start = this.polarToCartesian(endAngle, radius);
        const end = this.polarToCartesian(startAngle, radius);
        const sweep = endAngle - startAngle <= 180 ? '0' : '1';
        const d = `M${start.x},${start.y}A${radius},${radius},0,${sweep},0,${end.x},${end.y}`;

        return (_endAngle - startAngle === 360) ? `${d}z` : d;
    }

    /**
     * @see https://stackoverflow.com/a/62080606
     * @param {number} radius
     * @param {number} angle Angle in deg
     * @returns {{x: *, y: *}}
     */
    polarToCartesian(angle, radius) {
        const angleInRadians = angle * Math.PI / 180;
        const x = this.cx + (radius * Math.cos(angleInRadians));
        const y = this.cy + (radius * Math.sin(angleInRadians));
        return { x, y };
    }

    /**
     * Get space between path segments
     *
     * @param {number} circumference
     *
     * @returns {number}
     */
    getSegmentSpacing(circumference) {
        const segments = Math.floor((circumference / this.pathSegmentLength) * this.pathSegmentSpacing);
        return (circumference - segments * this.pathSegmentLength) / segments;
    }

    /**
     * Get mouse position relative to the SVG wrapper
     *
     * @param event
     * @returns {{x: number, y: number}}
     */
    static getMousePosition(event) {
        const wrapper = document.querySelector('.sliderWrapper').getBoundingClientRect();
        let x; let y; let mouseX; let
            mouseY;

        if (window.TouchEvent && event instanceof TouchEvent) {
            mouseX = event.touches[0].pageX;
            mouseY = event.touches[0].pageY;
        } else {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }

        x = mouseX - wrapper.left;
        y = mouseY - wrapper.top;

        return { x, y };
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

    /**
     * @param {number} angle
     * @returns {number}
     */
    static radiansToDegrees(angle) {
        return angle / (Math.PI / 180);
    }
}
