import{e as r,f as i,g as c,m as n,n as d,x as u}from"./chunk-3XYSXCB5.mjs";import{define as m}from"https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@b6fcbdc395b70cfb0013b1a9c255f331547adaaa/dist/cdn/core/iswc-element.min.mjs";var l='@charset "UTF-8";:host{display:block;min-width:0;font-family:var(--iswc-sans)}iswc-dialog{--width: min(26rem, 94vw)}.acceso{display:grid;gap:.75rem}.lema{margin:0;opacity:.75}[hidden]{display:none}';var s=class extends i{static tag="coco-acceso";static css=l;static deps=["iswc-dialog","iswc-input","iswc-button","iswc-callout"];#t="";#e=!1;inicial(){return{abierto:!1,modo:"entrar"}}#o(t){return u(this.shadow?.querySelector(`[data-campo="${t}"]`)??null)}async#a(t){if(!this.#e){this.#e=!0,this.#t="";try{t.modo==="crear"?await d({iusuario:this.#o("iusuario").toLowerCase(),nombre:this.#o("nombre"),email:this.#o("email"),password:this.#o("password")}):await n(this.#o("iusuario").toLowerCase(),this.#o("password")),this.#e=!1,c("\xA1Bienvenido a CoContable!","success"),this.emit("coco-cerrar",{})}catch(e){this.#e=!1,this.#t=e instanceof Error?e.message:"No se pudo entrar";let o=this.shadow?.querySelector("[data-error]");o&&(o.textContent=this.#t,o.removeAttribute("hidden"))}}}pintar(t,e){if(!e.abierto)return;let o=e.modo==="crear",a=()=>{this.#a(e)};t.append(r`
      <iswc-dialog open label=${o?"Crea tu cuenta":"Inicia sesi\xF3n"} oniswc-after-hide=${()=>this.emit("coco-cerrar",{})}>
        <form class="acceso" onsubmit=${p=>{p.preventDefault(),a()}}>
          <p class="lema">${o?"Tu contabilidad, fresca como agua de coco.":"Qu\xE9 bueno verte de nuevo."}</p>
          <iswc-input data-campo="iusuario" label="Usuario" autocomplete="username" required></iswc-input>
          ${o?r`<iswc-input data-campo="nombre" label="Tu nombre"></iswc-input><iswc-input data-campo="email" label="Correo" type="email" required></iswc-input>`:null}
          <iswc-input data-campo="password" label="Contraseña" type="password" password-toggle autocomplete=${o?"new-password":"current-password"} hint=${o?"M\xEDnimo 12 caracteres.":""} required oniswc-enter=${a}></iswc-input>
          <iswc-callout data-error color="danger" hidden></iswc-callout>
        </form>
        <iswc-button slot="footer" variant="text" onclick=${()=>{this.props={modo:o?"entrar":"crear"}}}>${o?"Ya tengo cuenta":"Crear una cuenta"}</iswc-button>
        <iswc-button slot="footer" data-enviar onclick=${a}>${o?"Crear cuenta":"Entrar"}</iswc-button>
      </iswc-dialog>
    `)}};m(s);
