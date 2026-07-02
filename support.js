/* ============================================================================
 *  support.js — runtime maison pour les composants "DC" exportés de Claude Design
 *  (FutureKawa.dc.html). Fournit React (via CDN), la classe de base DCLogic, et
 *  un moteur qui lit le template <x-dc> + le <script type="text/x-dc"> puis rend
 *  le composant dans la page.
 *
 *  Objectif : ouvrir le .html directement dans un navigateur et laisser le
 *  composant fetch le backend central (http://localhost:9000) en vrai.
 *
 *  Il ne s'agit PAS du runtime propriétaire de Claude Design (indisponible hors
 *  de l'aperçu) : c'est une réimplémentation minimale, suffisante pour ce fichier.
 * ==========================================================================*/
(function () {
  'use strict';

  // --- 1. Charger React + ReactDOM (UMD) depuis le CDN, puis démarrer -------
  var REACT = 'https://unpkg.com/react@18/umd/react.production.min.js';
  var REACTDOM = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Échec chargement ' + src)); };
      document.head.appendChild(s);
    });
  }

  // --- 2. Classe de base DCLogic (imite l'API utilisée par le composant) ----
  //   Le composant étend DCLogic et se sert de : state, setState, props,
  //   componentDidMount, renderVals(). On la construit au-dessus de
  //   React.Component pour bénéficier du cycle de rendu.
  function defineDCLogic(React) {
    function DCLogic(props) {
      React.Component.call(this, props);
      // `state = {...}` (champ de classe) s'exécute APRÈS ce constructeur, donc
      // React.Component a déjà mis this.state = null ; le champ le remplacera.
    }
    DCLogic.prototype = Object.create(React.Component.prototype);
    DCLogic.prototype.constructor = DCLogic;
    // renderVals() est fourni par le composant ; render() consomme sa sortie.
    DCLogic.prototype.render = function () {
      var vals = this.renderVals ? this.renderVals() : {};
      return window.__DC__.renderTemplate(vals, this);
    };
    return DCLogic;
  }

  // --- 3. Moteur de template : compile <x-dc> en arbre React ----------------
  //   Grammaire supportée (celle réellement utilisée par FutureKawa.dc.html) :
  //     {{ expr }}                interpolation (texte OU objet React)
  //     <sc-if value="{{x}}">     rend les enfants si x est truthy
  //     <sc-for list="{{l}}" as="item">  répète les enfants pour chaque élément
  //     style-hover="..."         style appliqué au survol
  //     onClick / onInput="{{f}}" handlers
  //     attributs style="..."     chaîne CSS -> objet style React
  //   Les expressions {{...}} sont résolues contre le dictionnaire `vals`
  //   (+ variables de boucle). On n'évalue PAS de JS arbitraire : une expression
  //   est un simple chemin d'accès (item.label, k.tint, true, etc.).

  var Engine = {
    React: null,

    // résout "a.b.c" / "true" / "false" dans un scope
    resolve: function (expr, scope) {
      expr = String(expr).trim();
      if (expr === 'true') return true;
      if (expr === 'false') return false;
      if (expr === '') return '';
      var parts = expr.split('.');
      var cur = scope;
      for (var i = 0; i < parts.length; i++) {
        if (cur == null) return undefined;
        cur = cur[parts[i]];
      }
      return cur;
    },

    // "{{ x }}" -> valeur ; "a {{x}} b" -> chaîne concaténée ; "" litéral -> tel quel
    interp: function (str, scope) {
      var m = /^\s*\{\{([^}]*)\}\}\s*$/.exec(str);
      if (m) return this.resolve(m[1], scope); // valeur brute (peut être un objet React)
      // sinon interpolation dans une chaîne
      var self = this;
      return str.replace(/\{\{([^}]*)\}\}/g, function (_, e) {
        var v = self.resolve(e, scope);
        return v == null ? '' : String(v);
      });
    },

    // "color:red;font-size:12px" -> {color:'red', fontSize:'12px'}
    parseStyle: function (css, scope) {
      css = this.interp(css, scope);
      var out = {};
      if (typeof css !== 'string') return out;
      css.split(';').forEach(function (decl) {
        var idx = decl.indexOf(':');
        if (idx < 0) return;
        var prop = decl.slice(0, idx).trim();
        var val = decl.slice(idx + 1).trim();
        if (!prop) return;
        var camel = prop.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
        out[camel] = val;
      });
      return out;
    },

    // compile un noeud DOM (du template) en élément React, dans un scope donné
    compile: function (node, scope, keyHint) {
      var React = this.React, self = this;

      // Texte
      if (node.nodeType === 3) {
        var txt = node.nodeValue;
        if (!/\{\{/.test(txt)) return txt;
        // Un nœud texte peut mêler du texte et des interpolations dont la
        // valeur est un OBJET React (ex: "{{ c.tIcon }} Température").
        // On découpe et on garde les objets React comme enfants au lieu de
        // les transformer en "[object Object]".
        var parts = txt.split(/(\{\{[^}]*\}\})/);
        var out = [];
        for (var pi = 0; pi < parts.length; pi++) {
          var seg = parts[pi];
          if (seg === '') continue;
          var mm = /^\{\{([^}]*)\}\}$/.exec(seg);
          if (mm) {
            var v = this.resolve(mm[1], scope);
            if (v == null || v === false) continue;
            out.push(v); // chaîne, nombre OU élément React
          } else {
            out.push(seg);
          }
        }
        return out.length === 1 ? out[0] : out;
      }
      if (node.nodeType !== 1) return null;

      var tag = node.tagName.toLowerCase();

      // <sc-if value="{{cond}}">children</sc-if>
      if (tag === 'sc-if') {
        var cond = this.interp(node.getAttribute('value') || '', scope);
        if (!cond) return null;
        return this.compileChildren(node, scope);
      }

      // <sc-for list="{{arr}}" as="item">children</sc-for>
      if (tag === 'sc-for') {
        var arr = this.interp(node.getAttribute('list') || '', scope);
        var as = node.getAttribute('as') || 'item';
        if (!Array.isArray(arr)) return null;
        var frag = [];
        for (var i = 0; i < arr.length; i++) {
          var child = Object.create(scope);
          child[as] = arr[i];
          child.$index = i;
          var compiled = this.compileChildren(node, child, String(i));
          frag.push(React.createElement(React.Fragment, { key: i }, compiled));
        }
        return frag;
      }

      // élément normal -> props + enfants
      var props = { key: keyHint };
      var hoverStyle = null;

      for (var a = 0; a < node.attributes.length; a++) {
        var at = node.attributes[a];
        var name = at.name, value = at.value;

        if (name === 'style') { props.style = this.parseStyle(value, scope); continue; }
        if (name === 'style-hover') { hoverStyle = this.parseStyle(value, scope); continue; }
        if (name === 'class') { props.className = value; continue; }

        if (name === 'onclick') { props.onClick = this.interp(value, scope); continue; }
        if (name === 'oninput') { props.onInput = this.interp(value, scope); props.onChange = props.onInput; continue; }

        // value/placeholder/title/etc.
        var resolved = /\{\{/.test(value) ? this.interp(value, scope) : value;
        // hint-placeholder-* : indices d'édition Claude Design -> ignorés au runtime
        if (/^hint-/.test(name)) continue;
        props[name] = resolved;
      }

      var children = this.compileChildren(node, scope);

      // survol : on gère via composant wrapper si un style-hover est présent
      if (hoverStyle) {
        return React.createElement(HoverEl, {
          key: keyHint, tag: tag, baseProps: props, hoverStyle: hoverStyle
        }, children);
      }

      return React.createElement.apply(React, [tag, props].concat(children));
    },

    compileChildren: function (node, scope) {
      var out = [];
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = this.compile(node.childNodes[i], scope, i);
        if (c == null) continue;
        if (Array.isArray(c)) out = out.concat(c);
        else out.push(c);
      }
      return out;
    },
  };

  // Petit composant pour gérer style-hover sans CSS externe
  var HoverEl = null;
  function defineHoverEl(React) {
    return function HoverEl(props) {
      var st = React.useState(false);
      var hovered = st[0], setHovered = st[1];
      var base = props.baseProps || {};
      var merged = Object.assign({}, base);
      merged.style = Object.assign({}, base.style, hovered ? props.hoverStyle : null);
      merged.onMouseEnter = function () { setHovered(true); };
      merged.onMouseLeave = function () { setHovered(false); };
      return React.createElement.apply(React, [props.tag, merged].concat(props.children || []));
    };
  }

  // --- 4. Lecture des props déclarées sur le <script data-props="..."> -------
  function readProps(scriptEl) {
    var raw = scriptEl.getAttribute('data-props');
    var out = {};
    if (raw) {
      try {
        var decl = JSON.parse(raw);
        Object.keys(decl).forEach(function (k) {
          if (k[0] === '$') return; // $preview etc.
          var d = decl[k];
          if (d && typeof d === 'object' && 'default' in d) out[k] = d.default;
        });
      } catch (e) { console.warn('[support.js] data-props illisible', e); }
    }
    // Surcharge possible via ?centralUrl=... ou window.CENTRAL_URL
    var qs = new URLSearchParams(location.search);
    if (qs.get('centralUrl')) out.centralUrl = qs.get('centralUrl');
    else if (window.CENTRAL_URL) out.centralUrl = window.CENTRAL_URL;
    if (qs.get('dark') === '1') out.darkDefault = true;
    return out;
  }

  // --- 5. Démarrage ---------------------------------------------------------
  Promise.all([loadScript(REACT), loadScript(REACTDOM)])
    .then(function () {
      var React = window.React, ReactDOM = window.ReactDOM;
      Engine.React = React;
      HoverEl = defineHoverEl(React);

      // expose DCLogic AVANT d'exécuter le <script type="text/x-dc">
      window.React = React;
      window.DCLogic = defineDCLogic(React);

      // le <x-dc> = template ; on le sort du flux et on garde son contenu
      var tpl = document.querySelector('x-dc');
      if (!tpl) throw new Error('<x-dc> introuvable');
      // le premier élément enfant significatif est la racine à rendre
      var rootTemplateNode = null;
      for (var i = 0; i < tpl.childNodes.length; i++) {
        var n = tpl.childNodes[i];
        if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'helmet') { rootTemplateNode = n; break; }
      }
      if (!rootTemplateNode) throw new Error('Racine du template <x-dc> introuvable');

      // <helmet> : injecter ses <link>/<style> dans le <head>
      var helmet = tpl.querySelector('helmet');
      if (helmet) {
        Array.prototype.forEach.call(helmet.childNodes, function (c) {
          if (c.nodeType === 1) document.head.appendChild(c.cloneNode(true));
        });
      }

      // moteur accessible au render() de DCLogic
      window.__DC__ = {
        renderTemplate: function (vals, instance) {
          // scope = props (host) fusionnées avec les valeurs de renderVals + méthodes
          var scope = Object.assign({}, vals);
          return Engine.compile(rootTemplateNode, scope, 'root');
        }
      };

      // récupère et exécute la classe Component du <script type="text/x-dc">
      var scriptEl = document.querySelector('script[type="text/x-dc"]');
      if (!scriptEl) throw new Error('<script type="text/x-dc"> introuvable');
      var props = readProps(scriptEl);

      // eval du code de la classe -> renvoie la classe Component
      var factory = new Function('DCLogic', 'React',
        scriptEl.textContent + '\n;return Component;');
      var Component = factory(window.DCLogic, React);

      // point de montage
      var mount = document.createElement('div');
      mount.id = 'dc-root';
      mount.style.cssText = 'width:100%;height:100%';
      // on remplace le template par le point de montage
      tpl.parentNode.replaceChild(mount, tpl);
      document.body.style.margin = '0';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';

      var root = ReactDOM.createRoot(mount);
      root.render(React.createElement(Component, props));
      console.info('[support.js] FutureKawa monté. Central =',
        props.centralUrl || 'http://localhost:9000 (défaut)');
    })
    .catch(function (e) {
      console.error('[support.js] démarrage impossible :', e);
      var pre = document.createElement('pre');
      pre.style.cssText = 'padding:24px;font:14px monospace;color:#b00;white-space:pre-wrap';
      pre.textContent = 'support.js : ' + e.message +
        '\n\nCe runtime a besoin d\'un accès réseau au CDN unpkg.com pour charger React.';
      document.body.appendChild(pre);
    });
})();
