<?php
declare(strict_types=1);

// Aucun secret ni message client n'est conservé dans le répertoire public.
function reply(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}
function unavailable(): void {
    reply(['error' => 'Le formulaire est momentanément indisponible. Écrivez à contact@arcadiainfo.com.'], 503);
}
function signature(string $secret, string $value): string {
    return hash_hmac('sha256', $value, $secret);
}

try {
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    if (!$root || !extension_loaded('curl')) unavailable();
    $private = dirname($root) . '/.arcadia-contact';
    $configFile = $private . '/config.php';
    if (!is_file($configFile)) unavailable();
    $config = require $configFile;
    $secret = $config['form_secret'] ?? '';
    $apiKey = $config['brevo_api_key'] ?? '';
    $origins = ['https://arcadiainfo.com', 'https://www.arcadiainfo.com'];
    if (!is_string($secret) || strlen($secret) < 32 || !is_string($apiKey) || $apiKey === '') unavailable();
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $now = (int) floor(microtime(true) * 1000);
    // Ne pas faire confiance à une adresse IP transmise par le visiteur dans un en-tête.
    $ip = signature($secret, 'contact-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    if ($path === '/api/contact/challenge' && $method === 'GET') {
        $payload = $now . '.' . bin2hex(random_bytes(16)) . '.' . $ip;
        reply(['token' => $payload . '.' . signature($secret, $payload)]);
    }
    if ($path !== '/api/contact' || $method !== 'POST') reply(['error' => 'Méthode non autorisée.'], 405);
    if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', $origins, true)) reply(['error' => 'Origine non autorisée.'], 403);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) reply(['error' => 'Format invalide.'], 415);
    $raw = file_get_contents('php://input', false, null, 0, 16001);
    if ($raw === false || strlen($raw) > 16000) reply(['error' => 'Message trop volumineux.'], 400);
    try { $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (Throwable $e) { reply(['error' => 'Message invalide.'], 400); }
    if (!is_array($data) || !is_string($data['token'] ?? null) || strlen($data['token']) > 300 || !empty($data['website'])) reply(['error' => 'Veuillez recharger le formulaire.'], 400);
    $parts = explode('.', $data['token']);
    $age = $now - (int) ($parts[0] ?? 0);
    if (count($parts) !== 4 || !ctype_digit($parts[0]) || $age < 1500 || $age > 1800000 || !hash_equals($ip, $parts[2]) || !hash_equals(signature($secret, implode('.', array_slice($parts, 0, 3))), $parts[3])) reply(['error' => 'La session du formulaire a expiré. Veuillez réessayer.'], 400);
    $fields = [];
    foreach (['nom'=>120, 'tel'=>40, 'email'=>254, 'metier'=>80, 'sujet'=>100, 'message'=>4000] as $key=>$max) {
        $value = $data[$key] ?? '';
        if (!is_string($value) || preg_match('//u', $value) !== 1) reply(['error'=>'Champ invalide.'], 400);
        $fields[$key] = trim($value);
        if (preg_match_all('/./us', $fields[$key]) > $max) reply(['error'=>'Champ trop long.'], 400);
    }
    if (preg_match_all('/./us', $fields['nom']) < 2 || preg_match_all('/./us', $fields['message']) < 10 || !filter_var($fields['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n\x00]/', $fields['email'] . $fields['nom'] . $fields['sujet'])) reply(['error'=>'Vérifiez votre nom, votre courriel et votre message (10 à 4 000 caractères).'], 400);

    // Le verrou rend les quotas et l'anti-double-envoi communs aux requêtes simultanées.
    $stateFile = $private . '/state.json';
    $lock = fopen($private . '/state.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) unavailable();
    $state = ['requests'=>[], 'limits'=>[]];
    if (is_file($stateFile)) {
        $state = json_decode((string) file_get_contents($stateFile), true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($state['requests'] ?? null) || !is_array($state['limits'] ?? null)) unavailable();
    }
    foreach (['requests','limits'] as $group) foreach ($state[$group] as $key=>$value) if ($value['expires'] < $now) unset($state[$group][$key]);
    $id = signature($secret, $data['token']);
    if (isset($state['requests'][$id])) {
        if ($state['requests'][$id]['status'] === 'sent') reply(['ok'=>true]);
        reply(['error'=>'Cette demande est déjà en cours de traitement. Ne la renvoyez pas immédiatement.'], 409);
    }
    $quarter = intdiv($now, 900000); $day = intdiv($now, 86400000);
    $quotas = ['ip:'.$ip.':'.$quarter=>[3, ($quarter+1)*900000], 'day:'.$day=>[30, ($day+1)*86400000]];
    foreach ($quotas as $key=>$quota) if (($state['limits'][$key]['count'] ?? 0) >= $quota[0]) reply(['error'=>'Trop de demandes rapprochées. Réessayez plus tard ou écrivez à contact@arcadiainfo.com.'], 429);
    foreach ($quotas as $key=>$quota) $state['limits'][$key] = ['count'=>($state['limits'][$key]['count'] ?? 0)+1, 'expires'=>$quota[1]];
    $state['requests'][$id] = ['status'=>'pending', 'expires'=>$now+86400000];
    $save = static function(array $state) use ($stateFile): void {
        $temp = $stateFile . '.tmp';
        if (file_put_contents($temp, json_encode($state, JSON_THROW_ON_ERROR)) === false) throw new RuntimeException('storage');
        chmod($temp, 0600);
        if (!rename($temp, $stateFile)) throw new RuntimeException('storage');
    };
    $save($state);
    // Garder la réservation même si Brevo ne répond pas : pas de renvoi aveugle.
    flock($lock, LOCK_UN); fclose($lock);
    $text = "Nouvelle demande depuis le site Arcadia\n\nNom : {$fields['nom']}\nCourriel : {$fields['email']}\nTéléphone : {$fields['tel']}\nActivité : {$fields['metier']}\nSujet : {$fields['sujet']}\n\n{$fields['message']}";
    $curl = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($curl, [CURLOPT_POST=>true, CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>15, CURLOPT_FOLLOWLOCATION=>false, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2, CURLOPT_HTTPHEADER=>['Content-Type: application/json', 'api-key: '.$apiKey], CURLOPT_POSTFIELDS=>json_encode(['sender'=>['name'=>'Arcadia','email'=>'contact@arcadiainfo.com'], 'to'=>[['email'=>'contact@arcadiainfo.com']], 'replyTo'=>['email'=>$fields['email'],'name'=>$fields['nom']], 'subject'=>'Demande Arcadia — '.$fields['sujet'], 'textContent'=>$text], JSON_THROW_ON_ERROR)]);
    $body = curl_exec($curl); $code = curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    $accepted = is_string($body) ? json_decode($body, true) : null;
    if ($code < 200 || $code >= 300 || !is_string($accepted['messageId'] ?? null)) reply(['error'=>'La réception ne peut pas être confirmée. Ne renvoyez pas immédiatement votre demande ; contactez contact@arcadiainfo.com.'], 502);
    // Une erreur de stockage après acceptation ne doit pas être présentée comme un échec d'envoi.
    try {
        $lock = fopen($private . '/state.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('lock');
        $state = json_decode((string)file_get_contents($stateFile), true, 32, JSON_THROW_ON_ERROR);
        $state['requests'][$id] = ['status'=>'sent','expires'=>$now+86400000];
        $save($state);
        flock($lock, LOCK_UN); fclose($lock);
    } catch (Throwable $e) { error_log('arcadia_contact_status_failed'); }
    reply(['ok'=>true]);
} catch (Throwable $e) {
    error_log('arcadia_contact_unavailable');
    unavailable();
}
