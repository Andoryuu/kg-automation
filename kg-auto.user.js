// ==UserScript==
// @name            KG automation
// @namespace       https://github.com/Andoryuu
// @description     Small automation for Kittens Game
// @version         1.5
// @grant           none
// @include         https://kittensgame.com/*
// @match           https://kittensgame.com/*
// ==/UserScript==

/**
 * Definitions
 */

// Resources
const alloy = 'alloy';
const beam = 'beam';
const catnip = 'catnip';
const catpower = 'manpower';
const coal = 'coal';
const compendium = 'compedium'; // yes, compedium
const culture = 'culture';
const faith = 'faith';
const iron = 'iron';
const manuscript = 'manuscript';
const minerals = 'minerals';
const parchment = 'parchment';
const plate = 'plate';
const science = 'science';
const slab = 'slab';
const steel = 'steel';
const titanium = 'titanium';
const wood = 'wood';

// Actions
const fastHunt = '#fastHuntContainer a';
const fastPraise = '#fastPraiseContainer a';
const observe = '#observeButton input';

// Conversions
const actionConversions = [
    [catpower,      fastHunt],
    [faith,         fastPraise],
]

const craftConversions = [
    [catnip,        wood],
    [wood,          beam],
    [minerals,      slab],
    [iron,          plate],
    [culture,       manuscript],
    [coal,          steel],
    [science,       compendium],
    [titanium,      alloy],
];

const togglableCrafts = [
    manuscript,
    compendium,
]

/**
 * Checkboxes
 */
function insertToggleFor(resourceName, labelOverride) {
    const checkboxId = resourceName + 'Toggle';
    const label = labelOverride || (resourceName + ' craft');
    const toggle
        = '<label for="' + checkboxId + '">' + label + '</label>'
        + '<input type="checkbox" id="' + checkboxId + '" checked="true">|\n';

    const footer = document.getElementById("footerLinks");

    footer.insertAdjacentHTML('afterbegin', toggle);

    return () => !document
        .getElementById(checkboxId)
        .checked
}

function insertCraftToggles() {
    const craftsMap = {};
    for (const resource of togglableCrafts) {
        craftsMap[resource] = insertToggleFor(resource);
    }

    return resourceName => {
        const isDisabled = craftsMap[resourceName];
        return isDisabled && isDisabled()
    }
}

/**
 * Craft helpers
 */
function isNearLimit(resourceName) {
    return document
        .querySelector('.resource_' + resourceName + ' .resLimitNotice');
}

function craft1pc(resourceName) {
    document
        .querySelector('.resource_' + resourceName + ' .craft-1pc')
        .click();
}

function craftAll(resourceName) {
    document
        .querySelector('.resource_' + resourceName + ' .all')
        .click();
}

function tryUse(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.click();
    }
}


/**
 * Main automation
 */
const isAutomationDisabled
    = insertToggleFor('automation', 'Automation');

const isCraftDisabledFor = insertCraftToggles();

setInterval(() => {

    if (isAutomationDisabled()) {
        return;
    }

    tryUse(observe);

    for (const [source, action] of actionConversions) {
        if (isNearLimit(source)) {
            tryUse(action);
        }
    }

    for (const [source, target] of craftConversions) {
        if (isCraftDisabledFor(target)) {
            continue;
        }

        if (isNearLimit(source)) {
            craft1pc(target);
        }
    }

    craftAll(parchment);

}, 1000)
