(() => {
  'use strict';
  // Seules les quatre activités connues peuvent préremplir le formulaire.
  const activities={avocats:'Cabinet d’avocats',architecture:'Cabinet d’architecture',batiment:'Entreprise du bâtiment',immobilier:'Agence immobilière'};
  const params=new URLSearchParams(location.search);
  const key=params.get('metier');
  const subjects={assistance:'Assistance à distance',station:'Station IA locale',equipement:'Ordinateurs et serveurs',maintenance:'Formation et maintenance',securite:'Données et sécurité'};
  const subject=document.getElementById('sujet'),subjectKey=params.get('sujet');
  if(subject && Object.hasOwn(subjects,subjectKey))subject.value=subjects[subjectKey];
  const select=document.getElementById('metier');
  if(select && Object.hasOwn(activities,key)) {select.value=activities[key];const details=select.closest('details');if(details)details.open=true;}
  const form=document.querySelector('.contact-form');if(!form)return;
  const button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-result');
  let token='',issued=0,pending=false;
  async function challenge(){
    const response=await fetch('/api/contact/challenge',{cache:'no-store'});
    const result=await response.json();if(!response.ok||!result.token)throw Error(result.error||'Formulaire indisponible.');
    token=result.token;issued=Date.now();
  }
  let ready=challenge().catch(()=>{});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!form.reportValidity())return;
    pending=true;button.disabled=true;button.textContent='Envoi en cours…';status.textContent='';form.setAttribute('aria-busy','true');
    try{
      await ready;
      if(!token||Date.now()-issued>25*60*1000){await challenge();await new Promise(resolve=>setTimeout(resolve,1600));}
      else if(Date.now()-issued<1600)await new Promise(resolve=>setTimeout(resolve,1600-(Date.now()-issued)));
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(new FormData(form)),token})});
      const result=await response.json();
      if(!response.ok||result.ok!==true){if(response.status===400)token='';throw Error(result.error||'L’envoi n’a pas abouti.');}
      status.textContent='Votre demande a bien été envoyée à Arcadia. Merci, nous reviendrons vers vous.';
      form.reset();token='';ready=challenge().catch(()=>{});
    }catch(error){status.textContent=(error instanceof TypeError?'Connexion interrompue : la réception ne peut pas être confirmée. Ne renvoyez pas immédiatement votre demande.':error.message)+' Votre saisie est conservée.';}
    finally{pending=false;button.disabled=false;button.textContent='Envoyer ma demande';form.removeAttribute('aria-busy');status.focus();}
  });
})();
