# Circular Slider

## Usage

### 1. Include the .js and .css (optional) files in your HTML page:

```html
<link rel="stylesheet" type="text/css" href="style.css">
<script type="text/javascript" src="CircularSlider.js"></script>
```

### 2. Prepare the sliders array

Each slider should have the following properties:

```js
{
    radius: 120,
    min: 40,
    max: 100,
    step: 10,
    initialValue: 20,
    name: 'Pink',
    color: '#fd6eea'
}
```

### 3. Initialize the slider

Pass the sliders array and a CSS selector for the container element in which to draw the sliders.

```js
const slider = new CircularSlider({
    container: '#sliderContainer',
    sliders: [
        {
            radius: 120,
            min: 40,
            max: 100,
            step: 10,
            initialValue: 20,
            name: 'Pink',
            color: '#fd6eea',
        },
        ...
    ]
});
slider.draw();
```

See [test.html](test.html) as an example.
