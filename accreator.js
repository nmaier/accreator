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
  
function fromPlugin() {
  let o = JSON.parse(plugin.src.value);
  plugin.ns.value = o.ns;
  plugin.prefix.value = o.prefix;
  plugin.match.value = o.match;
  plugin.resolve.value = o.resolve || '';
  plugin.process.value = o.process || '';
}

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
}

addEventListener('load', function() {
  removeEventListener('load', arguments.callee, true);
  
  let console = bespin.tiki.require('bespin:console').console;
  let Range = bespin.tiki.require('rangeutils:utils/range');
  
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
}, true);