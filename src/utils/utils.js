'use strict';

function toId(text) {
    if (text) {
        if (text.username && text.id) {
            text = text.username;
        } else if (text.id) {
            text = text.id;
        }
    } 
    if (typeof text !== 'string' && typeof text !== 'number') return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function toName(text) {
    if (text) {
        if (text.name) {
            text = text.name;
        } else if(text.username) {
            text = text.username;
        } else if(text.title) {
            text = text.title;
        }
    }
    return text;
}
function escapeHTML(str) {
    if (!str) return '';
    return ('' + str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/"/g, '&apos;')
        .replace(/\//g, '&#x2f;');
}
Object.assign(exports, {
    toId,
    toName,
    escapeHTML,
});