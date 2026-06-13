import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { initGame } from './stores/game.svelte'

initGame().then(() => {
  mount(App, { target: document.getElementById('app')! })
})
