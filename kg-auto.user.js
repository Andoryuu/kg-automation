// ==UserScript==
// @name            KG automation
// @namespace       https://github.com/Andoryuu
// @description     Small automation for Kittens Game
// @version         1.22
// @grant           none
// @include         https://kittensgame.com/*
// @match           https://kittensgame.com/*
// ==/UserScript==

// #region Definitions

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
/** @type {[resource: string, action: string][]} */
const actionConversions = [
    [catpower,      fastHunt],
    [faith,         fastPraise],
];

/** @type {[resource: string, defaultState: boolean, label: string][]} */
const togglableActions = [
    [catpower,      true,       'auto hunt'],
    [faith,         true,       'auto praise'],
];

/** @type {[from: string, to: string, highThroughput: boolean][]} */
const craftConversions = [
    [unobtainium,   eludium,        false],
    [uranium,       thorium,        false],
    [oil,           kerosene,       false],
    [titanium,      alloy,          false],
    [science,       blueprint,      false],
    [science,       compendium,     true],
    [culture,       manuscript,     true],
    [coal,          steel,          true],
    [iron,          plate,          true],
    [minerals,      slab,           true],
    [wood,          beam,           true],
    [catnip,        wood,           true],
];

/** @type {[resource: string, defaultState: boolean][]} */
const togglableCrafts = [
    [wood,          true],
    [beam,          true],
    [slab,          true],
    [plate,         true],
    [steel,         true],
    [parchment,     true],
    [manuscript,    true],
    [compendium,    true],
    [blueprint,     false],
    [alloy,         false],
    [kerosene,      false],
    [thorium,       false],
    [eludium,       false],
];

// #endregion

// #region Checkbox helpers

const toggleContainer = 'automationTogglesContainer';

function insertToggleContainer() {
    if (document.getElementById(toggleContainer)) {
        return;
    }

    const styles = [
        'text-align: end;',
        'margin-bottom: 30px;',
        'background: linear-gradient(to right, transparent, white);',
    ].join(' ');

    const container
        = '<div id="' + toggleContainer + '" style="' + styles + '"></div>';

    const footer = document.getElementById('footerLinks');

    footer.insertAdjacentHTML('afterbegin', container);
}

/**
 * @typedef {{ resourceName: string, labelOverride: string, defaultState: boolean }} ToggleOptions
 * @param {ToggleOptions} options
 * @returns {() => boolean}
 */
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

/**
 * @returns {(resourceName: string) => boolean}
 */
function insertCraftToggles() {
    /** @type {Object.<string, () => boolean>} */
    const craftsMap = {};

    for (const [resource, defaultVal] of togglableCrafts) {
        craftsMap[resource] = insertToggleFor({
            resourceName: resource,
            defaultState: defaultVal,
        });
    }

    return resourceName => {
        const isDisabled = craftsMap[resourceName];
        return isDisabled && isDisabled()
    }
}

/**
 * @returns {(resourceName: string) => boolean}
 */
function insertActionToggles() {
    /** @type {Object.<string, () => boolean>} */
    const actionsMap = {};

    for (const [resource, defaultVal, label] of togglableActions) {
        actionsMap[resource] = insertToggleFor({
            resourceName: resource,
            defaultState: defaultVal,
            labelOverride: label,
        });
    }

    return resourceName => {
        const isDisabled = actionsMap[resourceName];
        return isDisabled && isDisabled()
    }
}

// #endregion

// #region Craft helpers

/**
 * @param {string} selector
 */
function tryUse(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.click();
    }
}

/**
 * @param {string} resourceName
 * @returns {Element | null}
 */
function isNearLimit(resourceName) {
    return document
        .querySelector('.resource_' + resourceName + ' .resLimitNotice');
}

/**
 * @param {string} resourceName
 */
function craft1pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-1pc')
}

/**
 * @param {string} resourceName
 */
function craft5pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-5pc')
}

/**
 * @param {string} resourceName
 */
function craft10pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-10pc')
}

/**
 * @param {string} resourceName
 */
function craftAll(resourceName) {
    tryUse('.resource_' + resourceName + ' .all')
}

// #endregion

// #region Logic helpers

/**
 * @typedef {{ isNotReady: () => boolean, set: (value: number) => void }} Counter
 * @returns {Counter}
 */
function getCounter() {
    let counter = 0;
    return {
        isNotReady: () =>  {
            const notReady = counter > 0;
            if (notReady) {
                counter--;
            }
            return notReady;
        },
        set: value => {
            counter = value;
        }
    }
}

/**
 * @param {() => number | null} action
 * @returns {() => void}
 */
function wrapInCounter(action) {
    const counter = getCounter();

    return () => {
        if (counter.isNotReady()) {
            return;
        }

        const newCounterValue = action();

        if (newCounterValue) {
            counter.set(newCounterValue);
        }
    };
}

// #endregion

// #region Custom actions

function getLeviathansTradeAction() {
    return wrapInCounter(() => {

        const unobtainiumAmount = document
            .querySelector('.resource_' + unobtainium + ' .resAmount');

        // check once a minute if we got unobtainium unlocked
        if (!unobtainiumAmount) {
            return 120;
        }

        // 10K+ has characters which is NaN which is false
        if (+unobtainiumAmount.innerText < 5000) {
            return null;
        }

        for (const element of document.getElementsByClassName('pin-link')) {
            if (element.innerText === 'Trade with Leviathans') {
                element.firstChild.click();
                return null;
            }
        }

        // wait 5s if trade link was not found
        return 10;
    });
}

function getParchmentCraftAction() {
    return wrapInCounter(() => {

        craftAll(parchment);

        // try once every 2s to not spam
        return 4;
    });
}

// #endregion

// #region Setup

insertToggleContainer();

const isEmergencyDumpingOff
    = insertToggleFor({
        resourceName: 'emergencyDump',
        labelOverride: 'Crafting overload',
        defaultState: false,
    });

const isAutomationDisabled
    = insertToggleFor({
        resourceName: 'automation',
        labelOverride: 'Automation',
    });

const isActionDisabledFor = insertActionToggles();

const isCraftDisabledFor = insertCraftToggles();

const tryCraftParchment = getParchmentCraftAction();

const tryTradeWithLeviathans = getLeviathansTradeAction();
const isLeviathansTradeDisabled
    = insertToggleFor({
        resourceName: 'leviathansTrade',
        labelOverride: 'Leviathans trade',
        defaultState: false,
    })

// #endregion

// #region Main automation

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

    for (const [source, target, isHighTP] of craftConversions) {
        if (isCraftDisabledFor(target)) {
            continue;
        }

        if (isNearLimit(source)) {
            if (!isEmergencyDumpingOff()) {
                craft10pc(target);
            }

            if (isHighTP) {
                craft5pc(target);
            }

            craft1pc(target);
        }
    }

    if (!isCraftDisabledFor(parchment)) {
        tryCraftParchment();
    }

    if (!isLeviathansTradeDisabled()) {
        tryTradeWithLeviathans();
    }

}, 500)

// #endregion
