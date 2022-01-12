// ==UserScript==
// @name            KG automation
// @namespace       https://github.com/Andoryuu
// @description     Small automation for Kittens Game
// @version         1.13
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
const blueprint = 'blueprint';
const catnip = 'catnip';
const catpower = 'manpower';
const coal = 'coal';
const compendium = 'compedium'; // yes, compedium
const culture = 'culture';
const eludium = 'eludium';
const faith = 'faith';
const iron = 'iron';
const kerosene = 'kerosene';
const manuscript = 'manuscript';
const minerals = 'minerals';
const oil = 'oil';
const parchment = 'parchment';
const plate = 'plate';
const science = 'science';
const slab = 'slab';
const steel = 'steel';
const titanium = 'titanium';
const thorium = 'thorium';
const unobtainium = 'unobtainium';
const uranium = 'uranium';
const wood = 'wood';

// Actions
const fastHunt = '#fastHuntContainer a';
const fastPraise = '#fastPraiseContainer a';
const observe = '#observeButton input';

// Conversions
const actionConversions = [
    [catpower,      fastHunt],
    [faith,         fastPraise],
];

const togglableActions = [
    [catpower,      true,       'auto hunt'],
    [faith,         true,       'auto praise'],
];

const craftConversions = [
    [catnip,        wood],
    [wood,          beam],
    [minerals,      slab],
    [iron,          plate],
    [coal,          steel],
    [culture,       manuscript],
    [science,       compendium],
    [science,       blueprint],
    [titanium,      alloy],
    [oil,           kerosene],
    [uranium,       thorium],
    [unobtainium,   eludium],
];

const togglableCrafts = [
    [manuscript,    true],
    [compendium,    true],
    [blueprint,     false],
    [kerosene,      false],
    [thorium,       false],
    [eludium,       false],
];

/**
 * Checkboxes
 */
const toggleContainer = 'automationTogglesContainer';

function insertToggleContainer() {
    if (document.getElementById(toggleContainer)) {
        return;
    }

    const styles = [
        'text-align: end;',
        'margin-bottom: 30px;',
        'background: linear-gradient(to right, transparent, white);'
    ].join(' ');

    const container
        = '<div id="' + toggleContainer + '" style="' + styles + '"></div>';

    const footer = document.getElementById('footerLinks');

    footer.insertAdjacentHTML('afterbegin', container);
}

function insertToggleFor(options) {
    const checkboxId = options.resourceName + 'Toggle';
    const label = options.labelOverride || (options.resourceName + ' craft');
    const defaultState = options.defaultState === false ? '' : 'checked';
    const toggle
        = '<div>'
        + '<label for="' + checkboxId + '">' + label + '</label> '
        + '<input type="checkbox" id="' + checkboxId + '" ' + defaultState + '>|\n'
        + '</div>';

    const container = document.getElementById(toggleContainer);

    container.insertAdjacentHTML('afterbegin', toggle);

    return () => !document
        .getElementById(checkboxId)
        .checked
}

function insertCraftToggles() {
    const craftsMap = {};
    for (const [resource, defaultVal] of togglableCrafts) {
        craftsMap[resource] = insertToggleFor({
            resourceName: resource,
            defaultState: defaultVal
        });
    }

    return resourceName => {
        const isDisabled = craftsMap[resourceName];
        return isDisabled && isDisabled()
    }
}

function insertActionToggles() {
    const actionsMap = {};
    for (const [resource, defaultVal, label] of togglableActions) {
        actionsMap[resource] = insertToggleFor({
            resourceName: resource,
            defaultState: defaultVal,
            labelOverride: label
        });
    }

    return resourceName => {
        const isDisabled = actionsMap[resourceName];
        return isDisabled && isDisabled()
    }
}

/**
 * Craft helpers
 */
function tryUse(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.click();
    }
}

function isNearLimit(resourceName) {
    return document
        .querySelector('.resource_' + resourceName + ' .resLimitNotice');
}

function craft1pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-1pc')
}

function craftAll(resourceName) {
    tryUse('.resource_' + resourceName + ' .all')
}


/**
 * Main automation
 */
insertToggleContainer();

const isAutomationDisabled
    = insertToggleFor({
        resourceName: 'automation',
        labelOverride: 'Automation'
    });

const isActionDisabledFor = insertActionToggles();

const isCraftDisabledFor = insertCraftToggles();

setInterval(() => {

    if (isAutomationDisabled()) {
        return;
    }

    tryUse(observe);

    for (const [source, action] of actionConversions) {
        if (isActionDisabledFor(source)) {
            continue;
        }

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

}, 300)


/**
 * After game load initializations
 */
const afterLoadInit = setInterval(() => {
    if (!game) {
        return;
    }

    game.detailedPollutionInfo = true;

    clearInterval(afterLoadInit);

}, 10_000)
