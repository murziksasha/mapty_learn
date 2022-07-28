'use strict';

// prettier-ignore

class Workout {
  date = new Date();
  id = (new Date() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, Lng] from documentation library
    this.distance = distance; //in km
    this.duration = duration; //

  }
  _setDescription() {
    // prettier-ignore
    const months = [
    'January', 
    'February', 
    'March', 
    'April', 
    'May',
    'June', 
    'July', 
    'August', 
    'September',
    'October', 
    'November', 
    'December'
  ];
  this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//Application architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkOut.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('Could not get your position');
      });
    }
  }

  _loadMap(position) {
    console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.ru/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    //console.log(map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); //для фокуса ввода цифар
  }

  _hideForm() {
    //empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout running, create runnig object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid.
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout cycling, create cycyling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //check if data is valid.
      if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) {
        return alert('Inputs have to be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);
    console.log(this.#workouts);

    //render workout on map as marker
    this.renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //Hide the form and clear input fields
    this._hideForm();
  }
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }
  _renderWorkout(workout) {
    const { type, distance, duration, id, description, pace, cadence, speed, elevationGain } = workout;
    let html = `
        <li class="workout workout--${type}" data-id="${id}">
          <h2 class="workout__title">${description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (type === 'running') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (type === 'cycling') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
