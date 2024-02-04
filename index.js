const GRAVITY = 9.8 * 0.0005; // think everything in metric, but with custom scale
const MIN_SQUASH = 0.5;  // Ball squash scale can be this small minimum
const MAX_SQUASH = 2;   // and max this large
const MAX_SQUASH_DURATION = 150;
const MIN_SPEED = 0.1; // Ball should stop if it's slower than this, due to friction
const MAX_SPEED = 1.5; // Max speed of the ball due to air friction :)

// Ball object's private properties
// No class here because laziness
let _speed = 0.00; // Ball's current speed
let _position = 72; // Ball's current position
let _impactForce = null; // Latest Impact force when ball hits the ground
let _squash = 1.0; // Ball's current squash scale
let _floors = [];    // Array of all input's bottom position
let _currentFocusedInput = -1; // Currently focused input to keep track of collision
let _rotation = 0; // Ball's rotation
let _animating = false; // Holds if animation is running

// Posision the ball
const ballObject = document.querySelector('.ball');
const ballInnerObject = document.querySelector('.ball-inner');
const bootObject = document.querySelector('.boot');
const fromX = document.querySelector('.form-input').getBoundingClientRect().x;
ballObject.style.left = fromX - 28 + 'px';
bootObject.style.left = fromX - 48 + 'px';

// Init functions
document.querySelectorAll('.form-input').forEach((input, index) => {
    // Cache the location of all inputs
    _floors.push(input.getBoundingClientRect().bottom - 24);

    input.addEventListener('focus', () => {

        _currentFocusedInput = index;

        // if the position of the ball is below the focused input
        // Use kick animation to shoot it up
        if (_position > _floors[_currentFocusedInput]) {
            bootObject.style.top = `${_position}px`;

            const frames = [
                { transform: 'rotate(0deg)', opacity: 0.3 },
                { transform: 'rotate(-30deg)', opacity: 1 },
                { transform: 'rotate(-30deg)', opacity: 0 },
            ];

            const timing = {
                duration: 600,
                iterations: 1,
            };
            let animation = bootObject.animate(frames, timing);
            _speed = -2.2;
        }
        // Delay the animatino a bit so it's nicer
        setTimeout(() => {
            _rotation -= 250;
            ballInnerObject.style.transform = `rotate(${_rotation}deg)`;
            animate();
        }, 150);
    });

    input.addEventListener('blur', () => {
        _currentFocusedInput = -1;
        setTimeout(animate, 200);
    });

});

document.querySelector('form').addEventListener("submit", function (event) {
    event.preventDefault();
});



function animateSquash() {
    ballObject.style.transform = `translateY(${_position}px)  scaleY(${_squash})`;

    // Adjust the squash animation duration based on the hit speed of the ball
    let animationDuration = MAX_SQUASH_DURATION * (_impactForce / MAX_SPEED);

    // This creates a squash effect based on the hit force, that's between 1 and MIN_SQUASH
    const slope = (1 - MIN_SQUASH) / MAX_SPEED;
    const squashTo = 1 - slope * _impactForce;


    const scaling = [
        { transform: `translateY(${_position}px) scaleY(${_squash})` },
        { transform: `translateY(${_position}px) scaleY(${squashTo})` },
        { transform: `translateY(${_position}px) scaleY(${_squash})` },
    ];

    const timing = {
        duration: animationDuration,
        iterations: 1,
    };
    let animation = ballObject.animate(scaling, timing);

    // When squash animation is finished, start the bounce
    animation.onfinish = () => {
        _animating = false;
        _speed = _impactForce * 0.6;
        _impactForce = null;
        if (_speed > MIN_SPEED) {
            _speed = -_speed;
            animate();
        } else {
            // Don't bounce if the ball has slowed down too much, just stop
            stopAnimation();
            ballObject.style.transform = `translateY(${_floors[_currentFocusedInput]}px)  scaleY(1.0)`;
        }
    };
}

function checkCollision() {
    if (_floors[_currentFocusedInput] && (_position >= _floors[_currentFocusedInput])) {
        _position = _floors[_currentFocusedInput];
        // if this is the first hit, register the hit force(speed)
        if (_impactForce == null) {
            _impactForce = _speed;
        }
        return true;
    }
    return false;
}

function stopAnimation() {
    _animating = false;
    _impactForce = null;
    _speed = 0;
}

// This function creates a squash effect based on the speed of the ball, that's between 1 and MAX_SQUASH
function getSquashBySpeed(_speed) {
    let slope = (MAX_SQUASH - 1) / MAX_SPEED;
    return 1 + slope * Math.abs(_speed);
}


// Main animation loop
function animate() {
    let startTime = performance.now();
    function run() {

        let currentTime = performance.now();
        let delta = currentTime - startTime;

        // Calculate new speed and position
        _speed += GRAVITY * delta;
        _position += _speed * delta;

        //Iif no input is focused, ball will stop at the bottom
        if (_speed > 2 && _position > window.innerHeight + 100) {
            _position = 0;
            stopAnimation();
            return;
        }

        // Only check collision when the ball is going down
        if (_speed > 0 && checkCollision()) {
            animateSquash();
            return;
        }

        // Reset imapct force if moving
        _impactForce = null;

        _squash = getSquashBySpeed(_speed);
        ballObject.style.transform = `translateY(${_position}px)  scaleY(${_squash})`;
        //set new time
        startTime = currentTime;
        requestAnimationFrame(run);
    }

    // Start the animation if it's not already running
    if (!_animating) {
        _animating = true;
        requestAnimationFrame(run)
    }
}  
