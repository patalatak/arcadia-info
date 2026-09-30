(() => {
'use strict';
const dialog=document.getElementById('demo-dialog'),video=document.getElementById('demo-video'),start=document.getElementById('video-start'),status=document.getElementById('video-status'),title=document.getElementById('demo-title');
let source='',objectUrl='',controller,generation=0,trigger;
const chatToggle=document.getElementById('chat-toggle'),chatPanel=document.getElementById('chat-panel'),chatQuestions=document.getElementById('chat-questions'),chatExchange=document.getElementById('chat-exchange');
let resumeVideo=false;
const examples={
 avocats:[['Que change la version n° 3 ?','Dans le dossier fictif Durand / Atlas, une demande de réparation est ajoutée au dispositif, page 18. La version n° 2 ne la comportait pas. Le courrier de résiliation doit être obtenu et relu.'],['Quelle est la suite de cet échange ?','L’avocat demande le courrier complet à Monsieur Durand. Celui-ci le transmet dans le même dossier ; l’avocat retrouve sa réponse et ouvre la pièce avant de préparer ses conclusions.'],['Quelle action rejoint le planning ?','Le professionnel valide un créneau mercredi 17 juin, de 14 h à 16 h, pour préparer les conclusions. Le rappel de 13 h 30 est simulé. L’avocat reprend ensuite le brouillon, vérifie ses sources et partage un point d’avancement au client, sans transmettre ses notes internes. Aucun délai juridique n’est calculé.']],
 architecture:[['Quel changement faut-il étudier ?','Le compte rendu du 12 juin, page 2, demande un bureau à la place d’une chambre et le maintien de la terrasse. Le programme précédent mentionnait encore une chambre.'],['Quelle précision apporte le client ?','Madame Martin précise : une personne, deux jours par semaine, avec des appels nécessitant du calme. Ces informations complètent le programme ; elles ne valident pas la faisabilité.'],['Quelle action rejoint le planning ?','Après lecture des précisions, l’architecte valide un créneau mercredi de 14 h à 16 h pour étudier la variante bureau. La réunion client du jeudi était déjà présente. L’architecte relit ensuite la note de variante et partage le programme au client pour confirmation des besoins, sans validation automatique de faisabilité.']],
 batiment:[['Pourquoi le chiffrage ne peut-il pas être finalisé ?','Le CCTP fictif, page 12, prévoit une jonction de l’isolation aux menuiseries, mais le détail de raccordement manque aux plans indice B. Il doit être demandé au maître d’œuvre.'],['Quel complément est reçu ?','Le maître d’œuvre transmet le détail R-07 dans le même fil. L’entreprise l’ouvre, puis vérifie les quantités et les hypothèses avant de poursuivre son chiffrage. Aucun prix n’est inventé.'],['Quelle action rejoint le planning ?','L’entreprise valide mercredi de 14 h à 16 h pour vérifier le lot isolation. Le point technique du jeudi reste visible dans les vues de l’agenda. La note de préparation est relue et la réception de R-07 est confirmée au maître d’œuvre ; métré et chiffrage restent du ressort de l’entreprise.']],
 immobilier:[['Quel écart doit être vérifié ?','Pour l’appartement I-024, la fiche v02 indique 58 m² et le descriptif du propriétaire 61 m². L’assistant cite les deux documents sans choisir automatiquement une valeur.'],['Comment cet écart est-il traité ?','L’agent demande le document de mesurage. Madame Bernard le transmet : il indique 58 m² ; elle explique que 61 m² venait de son ancien descriptif. L’agent doit encore vérifier le bien concerné et le document.'],['Quelle action rejoint le planning ?','L’agent valide mercredi de 14 h à 16 h pour vérifier la fiche du bien avant correction. Le point propriétaire du jeudi est préexistant. La fiche corrigée est ensuite relue puis partagée au propriétaire pour confirmation. Aucune annonce n’est publiée par la démonstration.']]
};
const dossierVolumes={avocats:'Durand / Atlas · 6 500 pages OCR',architecture:'Maison des Tilleuls · 4 000 pages OCR',batiment:'Rénovation bâtiment A · 7 000 pages OCR',immobilier:'Appartement Lilas · 4 500 pages OCR'};
function closeChat(resume=true){chatPanel.hidden=true;chatToggle.setAttribute('aria-expanded','false');chatToggle.setAttribute('aria-label','Explorer les questions de cet exemple interactif');if(resume&&resumeVideo&&video.src)video.play().catch(()=>{});resumeVideo=false}
function configureChat(slug){
 closeChat(false);chatExchange.replaceChildren();chatQuestions.replaceChildren();document.getElementById('chat-context').textContent=dossierVolumes[slug]+' · volume fictif';
 for(const [question,answer] of examples[slug]||[]){const button=document.createElement('button');button.type='button';button.className='chat-question';button.textContent=question;button.addEventListener('click',()=>{const q=document.createElement('p'),a=document.createElement('p');q.className='chat-user';q.textContent=question;a.className='chat-answer';a.textContent=answer;chatExchange.replaceChildren(q,a)});chatQuestions.append(button)}
}
chatToggle.addEventListener('click',()=>{if(!chatPanel.hidden){closeChat();return}resumeVideo=!video.paused;video.pause();chatPanel.hidden=false;chatToggle.setAttribute('aria-expanded','true');chatToggle.setAttribute('aria-label','Fermer les questions de cet exemple interactif');document.getElementById('chat-reduce').focus()});
document.getElementById('chat-reduce').addEventListener('click',()=>{closeChat();chatToggle.focus()});
chatPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeChat();chatToggle.focus()}});
function cleanup(){
 closeChat(false);
 generation++;controller?.abort();video.pause();video.removeAttribute('src');video.load();
 if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl='';document.body.classList.remove('demo-modal-open');
}
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{
 cleanup();trigger=button;source=button.dataset.video;title.textContent=button.dataset.title;video.poster=button.dataset.poster;
 configureChat(button.dataset.demo);
 document.getElementById('demo-project-link').href='contact.html?metier='+encodeURIComponent(button.dataset.demo)+'#contact';
 video.controls=false;start.hidden=false;start.disabled=false;status.textContent='';dialog.showModal();document.body.classList.add('demo-modal-open');start.focus();
}));
document.getElementById('demo-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{cleanup();trigger?.focus()});
dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))dialog.close()});
start.addEventListener('click',async()=>{
 const current=generation;start.disabled=true;status.textContent='Chargement de la vidéo…';controller=new AbortController();
 const request=controller;const timeout=setTimeout(()=>request.abort(),30000);
 try{
  // Le chargement en mémoire préserve la navigation temporelle sans HTTP Range.
  const response=await fetch(source,{signal:request.signal});if(!response.ok)throw new Error('Vidéo indisponible');
  const blob=await response.blob();if(current!==generation)return;
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);video.src=objectUrl;video.controls=true;if(chatPanel.hidden)await video.play();else resumeVideo=true;
  if(current!==generation)return;start.hidden=true;status.textContent='';
 }catch{if(current===generation)status.textContent='Lecture indisponible. Appuyez pour réessayer.'}
 finally{clearTimeout(timeout);if(current===generation)start.disabled=false}
});
// Un lien métier ouvre la bonne démonstration, sans lancer la vidéo automatiquement.
const requestedDemo=new URLSearchParams(location.search).get('demo');
if(requestedDemo){
 const matchingButton=Array.from(document.querySelectorAll('[data-demo]')).find(button=>button.dataset.demo===requestedDemo);
 matchingButton?.click();
}
})();
