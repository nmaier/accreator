/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is accreator.
 *
 * The Initial Developer of the Original Code is
 * Nils Maier.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Nils Maier <maierman@web.de>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const BESPIN_OPTIONS = { "settings": { "tabstop": 2 }, "syntax": "js", "stealFocus": true };
const DRAG_IMAGE = new Image();
DRAG_IMAGE.src = 'style/plugin.png';

/* Helpers */
function $(id) document.getElementById(id);
function $$(query) document.querySelector(query);

if ('console' in this) {
  function log() {
    if (console) {
      console.log(Array.map(arguments, function(e) typeof(e) == 'object' ? e.toSource() : e.toString()).join('\n'))
    }
  }
}
else {
  function log() {}
}

/* bookkeeping */
let plugin = {
  ns: null,
  author: null,
  prefix: null,
  match: null,
  resolve: null,
  process: null,
  src: null,
  generateName: null,
  static: null,
  omitReferrer: null,
  useOriginName: null,
};
let _toToPlugin = null;

/**
 * Update the fields from a the plugin source
 */
function fromPlugin(value) {
  try {
    let o = JSON.parse(value || plugin.src.value);
    plugin.ns.value = o.ns;
    plugin.author.value = o.author || '';
    plugin.prefix.value = o.prefix;
    plugin.match.value = o.match;
    plugin.resolve.value = o.resolve || '';
    plugin.process.value = o.process || '';
    plugin.omitReferrer.value = o.generateName || '';
    plugin.static.checked = !!o.static;
    plugin.omitReferrer.checked = !!o.omitReferrer;
    plugin.useOriginName.checked = !!o.useOriginName;

    plugin.envresolve.dimensionsChanged();
    plugin.envprocess.dimensionsChanged();
    for each (let e in [plugin.resolve, plugin.process]) {
      e.setLineNumber(1);
    }
  }
  catch (ex) {
    log("fromPlugin", ex);
    if (value) {
      alert("Failed to load plugin");
    }
  }
}

/**
 * Update the plugin source from the contents of the fields
 */
function toPlugin() {
  try {
    // validate stuff
    
    for each (let e in [plugin.ns, plugin.author, plugin.prefix, plugin.match]) {
      if (!e.value) {
        let msg = e.id + " cannot be blank";
        e.setAttribute('error', true);
        throw new Error(msg);
      }
      e.removeAttribute('error');
    }
    try {
      log(new RegExp(plugin.match.value));
      plugin.match.removeAttribute('error');
    }
    catch (ex) {
      plugin.match.setAttribute('error', true);
      throw new Error("Invalid regular expression: " + ex.message);
    }
    
    if (!plugin.resolve.value && !plugin.process.value) {
      throw new Error('Either resolve or process or both must be implemented');
    }
  }
  catch (ex) {
    log(ex);
    plugin.src.value = ex.toSource();
    return;
  }
  let o = {
    type: 'sandbox',
    ns: plugin.ns.value,
    author: plugin.author.value,
    prefix: plugin.prefix.value,
    match: plugin.match.value,
    static: plugin.static.checked,
    omitReferrer: plugin.omitReferrer.checked,
    useOriginName: plugin.useOriginName.checked
  };
  if (plugin.resolve.value) {
    o.resolve = plugin.resolve.value;
  }
  if (plugin.process.value) {
    o.process = plugin.process.value;
  }
  if (plugin.generateName.value) {
    o.generateName = plugin.generateName.value;
  }
  plugin.src.value = JSON.stringify(o, null, 2);
  plugin.envsrc.dimensionsChanged();
  plugin.src.setLineNumber(1);
}

function onDrag(event) {
  event.dataTransfer.effectAllowed = 'copyMove';
  event.dataTransfer.dropEffect = 'copy';
  event.preventDefault();
}
function onDrop(event) {
  if (!event.dataTransfer) {
    return;
  }
  if (event.dataTransfer.files && event.dataTransfer.files.length == 1) {
    let file = event.dataTransfer.files[0];
    log("dropped", file.name, file.fileName, file.type);
    if (!/\.json$/i.test(event.dataTransfer.files[0].fileName)) {
      log("not a json file");
      return;
    }
    event.preventDefault();
    fromPlugin(event.dataTransfer.files[0].getAsText('utf-8'));
    return;
  }
  function loadData(type) {
    if (event.dataTransfer.types.contains(type)) {
      event.preventDefault();
      fromPlugin(event.dataTransfer.getData(type));
      return true;
    }
    return false;
  }
  [
    'application/json',
    'text/unicode',
    'text/plain',
  ].some(loadData);
}

/**
 * "Copy" handler
 */
function onDragStart(event) {
  log("dragstart");
  let dt = event.dataTransfer;
  dt.effectsAllowed = 'copy';
  dt.dropEffect = 'copy';
  dt.setDragImage(DRAG_IMAGE, 0, 0);
  dt.setData('text/plain', plugin.src.value);
  dt.setData('application/json', plugin.src.value);
}

/**
 * changed handler updating the plugin source
 */
function onChange() {
  if (_toToPlugin) {
    return;
  }
  _toToPlugin = setTimeout(function() {
    _toToPlugin = null;
    toPlugin();
  }, 250);
}

// load event handling
addEventListener('load', function() {
  removeEventListener('load', arguments.callee, true);

  log('load');

  // init bespin
  let bconsole = bespin.tiki.require('bespin:console').console;
  let Range = bespin.tiki.require('rangeutils:utils/range');

  // Set up bookkeeping and bespin
  for each (let i in ['ns', 'author', 'prefix', 'match', 'generateName', 'omitReferrer', 'useOriginName', 'static']) {
    plugin[i] = $(i);
    plugin[i].addEventListener('change', onChange, true);
    plugin[i].addEventListener('keypress', onChange, true);
  }
  window.onBespinLoad = function() {
    for each (let i in ['resolve', 'process', 'src']) {
      let e = $(i);
      bespin.useBespin(e, BESPIN_OPTIONS).then(function (env) {
        plugin[e.id] = env.editor;
        plugin['env' + e.id] = env;
        if (e.id != 'src') {
          env.editor.textChanged.add(onChange);
        }
        try {
          toPlugin();
        }
        catch (ex) {}
        setTimeout(function() {
          jQuery("#tabs").tabs();
          jQuery('#tabs').bind('tabsshow', function(event, ui) {
            plugin.envresolve.dimensionsChanged();
            plugin.envprocess.dimensionsChanged();
            plugin.envsrc.dimensionsChanged();
            log(ui.panel.id);
          });
        }, 0);
      });
    }
  }
  
  with (document.documentElement) {
    addEventListener('dragenter', onDrag, true);
    addEventListener('dragstart', onDragStart, true);
    addEventListener('dragover', onDrag, true);
    addEventListener('drop', onDrop, true);
  }
}, true);
