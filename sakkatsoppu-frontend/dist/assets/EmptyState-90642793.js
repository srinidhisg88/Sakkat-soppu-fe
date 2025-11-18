import{j as e}from"./ui-vendor-090db037.js";import{r as t,L as r}from"./react-vendor-e826ac9a.js";
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=e=>{const t=(e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase()))(e);return t.charAt(0).toUpperCase()+t.slice(1)},s=(...e)=>e.filter((e,t,r)=>Boolean(e)&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim(),o=e=>{for(const t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0};
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=t.forwardRef(({color:e="currentColor",size:r=24,strokeWidth:a=2,absoluteStrokeWidth:n,className:c="",children:l,iconNode:d,...m},h)=>t.createElement("svg",{ref:h,...i,width:r,height:r,stroke:e,strokeWidth:n?24*Number(a)/Number(r):a,className:s("lucide",c),...!l&&!o(m)&&{"aria-hidden":"true"},...m},[...d.map(([e,r])=>t.createElement(e,r)),...Array.isArray(l)?l:[l]])),c=(e,r)=>{const o=t.forwardRef(({className:o,...i},c)=>{return t.createElement(n,{ref:c,iconNode:r,className:s("lucide-".concat((l=a(e),l.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase())),"lucide-".concat(e),o),...i});var l});return o.displayName=a(e),o},l=c("shopping-basket",[["path",{d:"m15 11-1 9",key:"5wnq3a"}],["path",{d:"m19 11-4-7",key:"cnml18"}],["path",{d:"M2 11h20",key:"3eubbj"}],["path",{d:"m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4",key:"yiazzp"}],["path",{d:"M4.5 15.5h15",key:"13mye1"}],["path",{d:"m5 11 4-7",key:"116ra9"}],["path",{d:"m9 11 1 9",key:"1ojof7"}]]);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function d({title:t,description:a,icon:s,IconComponent:o,actionLabel:i,actionTo:n,secondary:c}){const d=o||l;return e.jsxs("div",{className:"bg-white rounded-xl shadow-sm p-8 text-center",children:[e.jsx("div",{className:"flex justify-center mb-4",children:s?e.jsx("div",{className:"text-4xl",children:s}):e.jsx(d,{className:"w-16 h-16 text-gray-300",strokeWidth:1.5})}),e.jsx("h3",{className:"text-xl font-semibold text-gray-800 mb-2",children:t}),a&&e.jsx("p",{className:"text-gray-600 mb-6",children:a}),i&&n&&e.jsx(r,{to:n,className:"inline-block bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700",children:i}),c&&e.jsx("div",{className:"mt-4",children:c})]})}export{d as E,c};
