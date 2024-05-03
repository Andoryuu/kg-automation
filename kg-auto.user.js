﻿// ==UserScript==
// @name            KG automation
// @namespace       https://github.com/Andoryuu
// @description     Small automation for Kittens Game
// @version         1.20
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

// from | to | is hight throughput
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

// resource | enabled by default
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
        'background: linear-gradient(to right, transparent, white);',
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
            defaultState: defaultVal,
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
            labelOverride: label,
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

function craft5pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-5pc')
}

function craft10pc(resourceName) {
    tryUse('.resource_' + resourceName + ' .craft-10pc')
}

function craftAll(resourceName) {
    tryUse('.resource_' + resourceName + ' .all')
}

/**
 * Custom actions
 */
function tryTradeWithLeviathans() {
    if (game.resPool.resourceMap.unobtainium.value < 5000) {
        return;
    }

    [...document.getElementsByClassName('pin-link')]
        .find(e => e.innerText == 'Trade with Leviathans')
        ?.firstChild
        .click();
}

/**
 * Main automation
 */
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

const isLeviathansTradeDisabled
    = insertToggleFor({
        resourceName: 'leviathansTrade',
        labelOverride: 'Leviathans trade',
        defaultState: false,
    })

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
        craftAll(parchment);
    }

    if (!isLeviathansTradeDisabled()) {
        tryTradeWithLeviathans();
    }

}, 500)
