import{e as t,f as s,g as c,m as n,n as d,y as u}from"./chunk-UQNNCJD3.mjs";import{define as m}from"https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@b6fcbdc395b70cfb0013b1a9c255f331547adaaa/dist/cdn/core/iswc-element.min.mjs";var l='@charset "UTF-8";:host{display:block;min-width:0;font-family:var(--iswc-sans)}iswc-dialog{--width: min(26rem, 94vw)}.acceso{display:grid;gap:.75rem}.banner{height:5.5rem;margin:-.25rem 0 0;border-radius:var(--iswc-radius);background:var(--coco-arte-paisaje) no-repeat center/cover}@media print{.banner{display:none}}.lema{margin:0;opacity:.75}[hidden]{display:none}';var i=class extends s{static tag="coco-acceso";static css=l;static deps=["iswc-dialog","iswc-input","iswc-button","iswc-callout"];#a="";#o=!1;inicial(){return{abierto:!1,modo:"entrar"}}#e(a){return u(this.shadow?.querySelector(`[data-campo="${a}"]`)??null)}async#r(a){if(!this.#o){this.#o=!0,this.#a="";try{a.modo==="crear"?await d({iusuario:this.#e("iusuario").toLowerCase(),nombre:this.#e("nombre"),email:this.#e("email"),password:this.#e("password")}):await n(this.#e("iusuario").toLowerCase(),this.#e("password")),this.#o=!1,c("\xA1Bienvenido a CoContable!","success"),this.emit("coco-cerrar",{})}catch(o){this.#o=!1,this.#a=o instanceof Error?o.message:"No se pudo entrar";let e=this.shadow?.querySelector("[data-error]");e&&(e.textContent=this.#a,e.removeAttribute("hidden"))}}}pintar(a,o){if(!o.abierto)return;let e=o.modo==="crear",r=()=>{this.#r(o)};a.append(t`
      <iswc-dialog open label=${e?"Crea tu cuenta":"Inicia sesi\xF3n"} oniswc-after-hide=${()=>this.emit("coco-cerrar",{})}>
        <form class="acceso" onsubmit=${p=>{p.preventDefault(),r()}}>
          <div class="banner" aria-hidden="true"></div>
          <p class="lema">${e?"Tu contabilidad, fresca como agua de coco.":"Qu\xE9 bueno verte de nuevo."}</p>
          <iswc-input data-campo="iusuario" label="Usuario" autocomplete="username" required></iswc-input>
          ${e?t`<iswc-input data-campo="nombre" label="Tu nombre"></iswc-input><iswc-input data-campo="email" label="Correo" type="email" required></iswc-input>`:null}
          <iswc-input data-campo="password" label="Contraseña" type="password" password-toggle autocomplete=${e?"new-password":"current-password"} hint=${e?"M\xEDnimo 12 caracteres.":""} required oniswc-enter=${r}></iswc-input>
          <iswc-callout data-error color="danger" hidden></iswc-callout>
        </form>
        <iswc-button slot="footer" variant="text" onclick=${()=>{this.props={modo:e?"entrar":"crear"}}}>${e?"Ya tengo cuenta":"Crear una cuenta"}</iswc-button>
        <iswc-button slot="footer" data-enviar onclick=${r}>${e?"Crear cuenta":"Entrar"}</iswc-button>
      </iswc-dialog>
    `)}};m(i);
