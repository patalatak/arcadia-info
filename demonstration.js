(() => {
'use strict';
const video=document.getElementById('demo-video'),start=document.getElementById('video-start'),status=document.getElementById('video-status'),player=document.getElementById('gallery-player');
const choices=Array.from(document.querySelectorAll('[data-demo]')),coverLabel=document.getElementById('cover-label');
const nativePlayer=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const iphoneVideos={avocats:'assets/demo-ios/avocats.mp4',architecture:'assets/demo-ios/architecture.mp4',batiment:'assets/demo-ios/batiment.mp4',immobilier:'assets/demo-ios/immobilier.mp4'};
const nativeLink=document.createElement('a');
nativeLink.className='textlink native-video-link';nativeLink.textContent='Ouvrir la vidéo en plein écran';nativeLink.target='_blank';nativeLink.rel='noopener';nativeLink.hidden=!nativePlayer;
document.getElementById('demo-caption').insertAdjacentElement('afterend',nativeLink);
player.classList.toggle('is-native',nativePlayer);
const chatToggle=document.getElementById('chat-toggle'),chatPanel=document.getElementById('chat-panel'),chatQuestions=document.getElementById('chat-questions'),chatExchange=document.getElementById('chat-exchange');
let active,generation=0,resumeVideo=false;
const examples={
 avocats:[['Que change la version n° 3 ?','Dans le dossier fictif Durand / Atlas, une demande de réparation est ajoutée au dispositif, page 18. La version n° 2 ne la comportait pas. Le courrier de résiliation doit être obtenu et relu.'],['Quelle est la suite de cet échange ?','L’avocat demande le courrier complet à Monsieur Durand. Celui-ci le transmet dans le même dossier ; l’avocat retrouve sa réponse et ouvre la pièce avant de préparer ses conclusions.'],['Quelle action rejoint le planning ?','Le professionnel valide un créneau mercredi 17 juin, de 14 h à 16 h, pour préparer les conclusions. Le rappel de 13 h 30 est simulé. L’avocat reprend ensuite le brouillon, vérifie ses sources et partage un point d’avancement au client, sans transmettre ses notes internes. Aucun délai juridique n’est calculé.']],
 architecture:[['Quel changement faut-il étudier ?','Le compte rendu du 12 juin, page 2, demande un bureau à la place d’une chambre et le maintien de la terrasse. Le programme précédent mentionnait encore une chambre.'],['Quelle précision apporte le client ?','Madame Martin précise : une personne, deux jours par semaine, avec des appels nécessitant du calme. Ces informations complètent le programme ; elles ne valident pas la faisabilité.'],['Quelle action rejoint le planning ?','Après lecture des précisions, l’architecte valide un créneau mercredi de 14 h à 16 h pour étudier la variante bureau. La réunion client du jeudi était déjà présente. L’architecte relit ensuite la note de variante et partage le programme au client pour confirmation des besoins, sans validation automatique de faisabilité.']],
 batiment:[['Pourquoi le chiffrage ne peut-il pas être finalisé ?','Le CCTP fictif, page 12, prévoit une jonction de l’isolation aux menuiseries, mais le détail de raccordement manque aux plans indice B. Il doit être demandé au maître d’œuvre.'],['Quel complément est reçu ?','Le maître d’œuvre transmet le détail R-07 dans le même fil. L’entreprise l’ouvre, puis vérifie les quantités et les hypothèses avant de poursuivre son chiffrage. Aucun prix n’est inventé.'],['Quelle action rejoint le planning ?','L’entreprise valide mercredi de 14 h à 16 h pour vérifier le lot isolation. Le point technique du jeudi reste visible dans les vues de l’agenda. La note de préparation est relue et la réception de R-07 est confirmée au maître d’œuvre ; métré et chiffrage restent du ressort de l’entreprise.']],
 immobilier:[['Quel écart doit être vérifié ?','Pour l’appartement I-024, la fiche v02 indique 58 m² et le descriptif du propriétaire 61 m². L’assistant cite les deux documents sans choisir automatiquement une valeur.'],['Comment cet écart est-il traité ?','L’agent demande le document de mesurage. Madame Bernard le transmet : il indique 58 m² ; elle explique que 61 m² venait de son ancien descriptif. L’agent doit encore vérifier le bien concerné et le document.'],['Quelle action rejoint le planning ?','L’agent valide mercredi de 14 h à 16 h pour vérifier la fiche du bien avant correction. Le point propriétaire du jeudi est préexistant. La fiche corrigée est ensuite relue puis partagée au propriétaire pour confirmation. Aucune annonce n’est publiée par la démonstration.']]
};
const dossierVolumes={avocats:'Durand / Atlas · 6 500 pages OCR',architecture:'Maison des Tilleuls · 4 000 pages OCR',batiment:'Rénovation bâtiment A · 7 000 pages OCR',immobilier:'Appartement Lilas · 4 500 pages OCR'};

function closeChat(resume=true){chatPanel.hidden=true;chatToggle.setAttribute('aria-expanded','false');if(resume&&resumeVideo&&video.src)video.play().catch(()=>{});resumeVideo=false}
function configureChat(slug){
 closeChat(false);chatExchange.replaceChildren();chatQuestions.replaceChildren();document.getElementById('chat-context').textContent=dossierVolumes[slug]+' · volume fictif';
 for(const [question,answer] of examples[slug]||[]){const button=document.createElement('button');button.type='button';button.className='chat-question';button.textContent=question;button.addEventListener('click',()=>{const q=document.createElement('p'),a=document.createElement('p');q.className='chat-user';q.textContent=question;a.className='chat-answer';a.textContent=answer;chatExchange.replaceChildren(q,a)});chatQuestions.append(button)}
}
function stop(){
 generation++;video.pause();video.removeAttribute('src');video.load();
 player.classList.remove('is-playing');player.removeAttribute('aria-busy');
}
function selectDemo(button){
 stop();active=button;choices.forEach(choice=>{const selected=choice===button;choice.classList.toggle('is-active',selected);choice.setAttribute('aria-pressed',String(selected))});
 video.poster=button.dataset.poster;video.setAttribute('aria-label','Démonstration : '+button.dataset.title+', avec voix off française');
 start.setAttribute('aria-label','Lire la démonstration : '+button.dataset.title);start.hidden=nativePlayer;start.disabled=false;video.controls=nativePlayer;status.textContent='';coverLabel.textContent='Démo · '+button.dataset.label;
 if(nativePlayer){
  // Sur iPhone, seul le bouton natif Apple déclenche la lecture : aucun play() automatique.
  video.src=iphoneVideos[button.dataset.demo];video.preload='none';video.load();nativeLink.href=iphoneVideos[button.dataset.demo];
 }
 document.getElementById('demo-project-link').href='contact.html?metier='+encodeURIComponent(button.dataset.demo)+'#contact';
 document.getElementById('demo-caption').textContent=button.dataset.caption;
 document.getElementById('demo-meta').textContent=button.dataset.duration+' · Avec voix off · Vous pouvez couper le son dans le lecteur.';
 configureChat(button.dataset.demo);
}
async function playDemo(){
 if(nativePlayer)return;
 const current=generation;start.disabled=true;status.textContent='Chargement de la vidéo…';player.setAttribute('aria-busy','true');
 try{
  // Safari doit recevoir play() directement pendant le clic, sans attendre fetch().
  // L’URL directe laisse le navigateur charger et parcourir la vidéo progressivement.
  if(video.getAttribute('src')!==active.dataset.video)video.src=active.dataset.video;
  video.controls=true;
  if(chatPanel.hidden)await video.play();else resumeVideo=true;
  if(current!==generation)return;start.hidden=true;status.textContent='';player.classList.add('is-playing');
 }catch(error){
  if(current!==generation)return;
  if(error.name==='NotAllowedError'){
   // Si le navigateur impose son propre bouton, ne pas le masquer par notre pastille.
   start.hidden=true;player.classList.add('is-playing');status.textContent='Appuyez sur le bouton de lecture du lecteur.';
  }else status.textContent='Lecture indisponible. Appuyez sur ▶ pour réessayer.';
 }
 finally{if(current===generation){start.disabled=false;player.removeAttribute('aria-busy')}}
}
// Choisir un métier affiche sa couverture ; seul le bouton de lecture lance la vidéo.
choices.forEach(button=>button.addEventListener('click',()=>selectDemo(button)));
start.addEventListener('click',playDemo);
video.addEventListener('playing',()=>{start.hidden=true;status.textContent='';player.classList.add('is-playing');player.removeAttribute('aria-busy')});
video.addEventListener('error',()=>{if(nativePlayer)status.textContent='Utilisez « Ouvrir la vidéo en plein écran » ci-dessous.'});
chatToggle.addEventListener('click',()=>{if(!chatPanel.hidden){closeChat();return}resumeVideo=!video.paused;video.pause();chatPanel.hidden=false;chatToggle.setAttribute('aria-expanded','true');document.getElementById('chat-reduce').focus()});
document.getElementById('chat-reduce').addEventListener('click',()=>{closeChat();chatToggle.focus()});
chatPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeChat();chatToggle.focus()}});
window.addEventListener('pagehide',stop);
const requestedDemo=new URLSearchParams(location.search).get('demo');
selectDemo(choices.find(button=>button.dataset.demo===requestedDemo)||choices[0]);
})();
