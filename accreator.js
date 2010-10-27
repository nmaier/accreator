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

/* Helpers */
function $(id) document.getElementById(id);
function $$(query) document.querySelector(query);

if (console) {
  function log() {
    if (console) {
      console.log(Array.map(arguments, function(e) e.toString()).join('\n'))
    }
  }
}
else {
  function log() {}
}

/* bookkeeping */
let plugin = {
  ns: null,
  prefix: null,
  match: null,
  resolve: null,
  process: null,
  src: null
};
let _toToPlugin = null;

/**
 * Update the fields from a the plugin source
 */
function fromPlugin(value) {
  let o = JSON.parse(value || plugin.src.value);
  plugin.ns.value = o.ns;
  plugin.prefix.value = o.prefix;
  plugin.match.value = o.match;
  plugin.resolve.value = o.resolve || '';
  plugin.process.value = o.process || '';

  for each (let e in [plugin.resolve, plugin.process]) {
    e.setLineNumber(0);
  }
}

/**
 * Update the plugin source from the contents of the fields
 */
function toPlugin() {
  let o = {
    type: 'sandbox',
    ns: plugin.ns.value,
    prefix: plugin.prefix.value,
    match: plugin.match.value
  }
  if (plugin.resolve.value) {
    o.resolve = plugin.resolve.value;
  }
  if (plugin.process.value) {
    o.process = plugin.process.value;
  }
  plugin.src.value = JSON.stringify(o, null, 2);
  plugin.src.setLineNumber(0);
}

function onDrag(event) {
  event.dataTransfer.effectAllowed = 'copyMove';
  event.dataTransfer.dropEffect = 'copy';
  event.preventDefault();
}
function onDrop(event) {
  event.preventDefault();
  if (!event.dataTransfer
    || !event.dataTransfer.files
    || event.dataTransfer.files.length != 1
  ) {
    log("no or too many files in dnd");
    return;
  }
  let file = event.dataTransfer.files[0];
  log("dropped", file.name, file.fileName, file.type);
  if (!/\.json$/i.test(event.dataTransfer.files[0].fileName)
  ) {
    log("not a json file");
    return;
  }

  // always prevent default, else browser might load the json file
  // if it fails to parse
  event.preventDefault();

  fromPlugin(event.dataTransfer.files[0].getAsText('utf-8'));
}

addEventListener('load', function() {
  removeEventListener('load', arguments.callee, true);

  log('load');

  // init bespin
  let console = bespin.tiki.require('bespin:console').console;
  let Range = bespin.tiki.require('rangeutils:utils/range');

  // Set up bookkeeping and bespin
  ['ns', 'prefix', 'match'].forEach(function(e) plugin[e] = $(e));
  for each (let i in ['resolve', 'process', 'src']) {
    let e = $(i);
    bespin.useBespin(e, BESPIN_OPTIONS).then(function (env) {
      plugin[e.id] = env.editor;
      if (e.id != 'src') {
        env.editor.textChanged.add(function() {
          if (_toToPlugin) {
            return;
          }
          _toToPlugin = setTimeout(function() {
            _toToPlugin = null;
            toPlugin();
          }, 250);
        });
      }
    });
  }

  with (document.documentElement) {
    addEventListener('dragenter', onDrag, true);
    addEventListener('dragover', onDrag, true);
    addEventListener('drop', onDrop, true);
  }
}, true);