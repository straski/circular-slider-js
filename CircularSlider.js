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
            y: (index + 1) * 50,
        }));

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
            cx: slider.initialValue,
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
     */
    updateSlider() {
    }

    /**
     * Update legend
     */
    updateLegend() {
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