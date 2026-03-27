import type { TicketMessage, TransferRecord } from '@/types/ticket.types'

const now = new Date('2026-03-25T12:00:00Z')
const minsAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString()

export const mockMessages: TicketMessage[] = [
  // TK-001
  { id: 'm-001-1', ticketId: 'tk-001', type: 'public_inbound', authorId: null, authorName: 'Akbank Destek', content: 'Merhaba, ödeme sayfamız yaklaşık 30 dakika önce yüklenmeyi durdurdu. Müşterilerimiz işlemlerini tamamlayamıyor. Lütfen acil destek veriniz.', createdAt: minsAgo(15), attachments: [] },
  { id: 'm-001-2', ticketId: 'tk-001', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Öncelik: Kritik. Grup: Trade.', createdAt: minsAgo(15), attachments: [] },

  // TK-002
  { id: 'm-002-1', ticketId: 'tk-002', type: 'public_inbound', authorId: null, authorName: 'Garanti BBVA Destek', content: 'Hesap bakiyelerimiz yanlış gösteriliyor. Birden fazla müşterimiz şikayette bulunuyor. Bakiye -500 TL gösterilmesi gerektiğinde +500 TL olarak görünüyor.', createdAt: minsAgo(45), attachments: [] },
  { id: 'm-002-2', ticketId: 'tk-002', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Öncelik: Yüksek. Grup: Trade.', createdAt: minsAgo(45), attachments: [] },

  // TK-003
  { id: 'm-003-1', ticketId: 'tk-003', type: 'public_inbound', authorId: null, authorName: 'Şeker Finansman Destek', content: 'Faiz hesaplama modülümüzde hatalı sonuçlar alıyoruz. Yıllık %8 faiz yerine %0.8 hesaplanıyor gibi görünüyor. Acil müdahale gerekiyor.', createdAt: minsAgo(60), attachments: [] },
  { id: 'm-003-2', ticketId: 'tk-003', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'API entegrasyonu üzerinden ticket oluşturuldu.', createdAt: minsAgo(60), attachments: [] },

  // TK-004
  { id: 'm-004-1', ticketId: 'tk-004', type: 'public_inbound', authorId: null, authorName: 'Allianz Destek', content: 'Döküman yükleme sistemimizde "500 Internal Server Error" alıyoruz. Poliçe belgelerini sisteme yükleyemiyoruz. Lütfen kontrol edin.', createdAt: minsAgo(90), attachments: [] },
  { id: 'm-004-2', ticketId: 'tk-004', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Öncelik: Orta. Grup: Operations.', createdAt: minsAgo(90), attachments: [] },

  // TK-005
  { id: 'm-005-1', ticketId: 'tk-005', type: 'public_inbound', authorId: null, authorName: 'Yapı Kredi Destek', content: 'Sistemimize giriş yapamıyoruz. Şifre sıfırlama e-postalarını da almıyoruz. 5 kullanıcımız etkilendi.', createdAt: minsAgo(120), attachments: [] },
  { id: 'm-005-2', ticketId: 'tk-005', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Öncelik: Orta. Grup: Trade.', createdAt: minsAgo(120), attachments: [] },

  // TK-006
  { id: 'm-006-1', ticketId: 'tk-006', type: 'public_inbound', authorId: null, authorName: 'Akbank Destek', content: 'Transfer işlemi 2 saattir "beklemede" statüsünde. Müşteri hesabından para çekildi ancak karşı hesaba geçmedi. Acil işlem gerekiyor.', createdAt: minsAgo(240), attachments: [] },
  { id: 'm-006-2', ticketId: 'tk-006', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Mehmet Demir atandı.', createdAt: minsAgo(240), attachments: [] },
  { id: 'm-006-3', ticketId: 'tk-006', type: 'public_outbound', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Merhaba, konuyu aldık ve hemen inceliyoruz. Transfer işleminin referans numarasını paylaşabilir misiniz?', createdAt: minsAgo(220), attachments: [] },
  { id: 'm-006-4', ticketId: 'tk-006', type: 'internal_note', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Transfer modülünde bir deadlock tespit ettim. DBA ile görüşüyorum.', createdAt: minsAgo(200), attachments: [] },
  { id: 'm-006-5', ticketId: 'tk-006', type: 'public_inbound', authorId: null, authorName: 'Akbank Destek', content: 'Referans No: TRF-2026-38291. Lütfen acele edin, müşteri şikayeti çok yoğun.', createdAt: minsAgo(180), attachments: [] },
  { id: 'm-006-6', ticketId: 'tk-006', type: 'public_outbound', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Referans numarasını aldık. Transfer kaydı veritabanında bulundu. Manuel müdahale için onay bekleniyoruz. 30 dakika içinde geri dönüş sağlayacağız.', createdAt: minsAgo(30), attachments: [] },

  // TK-007
  { id: 'm-007-1', ticketId: 'tk-007', type: 'public_inbound', authorId: null, authorName: 'Garanti BBVA IT', content: 'API entegrasyonumuz kesildi. 15:30\'dan itibaren tüm istekler 503 dönüyor. Webhook URL\'imize ulaşamıyoruz.', createdAt: minsAgo(300), attachments: [] },
  { id: 'm-007-2', ticketId: 'tk-007', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Zeynep Çelik atandı.', createdAt: minsAgo(300), attachments: [] },
  { id: 'm-007-3', ticketId: 'tk-007', type: 'public_outbound', authorId: 'u5', authorName: 'Zeynep Çelik', content: 'Merhaba, konuyu alıyoruz. API loglarını inceliyoruz. En kısa sürede geri döneceğiz.', createdAt: minsAgo(280), attachments: [] },
  { id: 'm-007-4', ticketId: 'tk-007', type: 'internal_note', authorId: 'u5', authorName: 'Zeynep Çelik', content: 'Load balancer\'da konfigürasyon değişikliği yapılmış. Ops ekibiyle koordineli çalışıyoruz.', createdAt: minsAgo(200), attachments: [] },
  { id: 'm-007-5', ticketId: 'tk-007', type: 'internal_note', authorId: 'u7', authorName: 'Fatma Şahin', content: 'Ops tarafından nginx konfigürasyonu kontrol edildi, hata bulundu. Düzeltme uygulanıyor.', createdAt: minsAgo(120), attachments: [] },

  // TK-008
  { id: 'm-008-1', ticketId: 'tk-008', type: 'public_inbound', authorId: null, authorName: 'Yapı Kredi Destek', content: 'Ekstre taleplerimiz gerçekleştirilemiyor. PDF oluşturma sırasında "Timeout" hatası alıyoruz. Müşteri talepleri birikti.', createdAt: minsAgo(480), attachments: [] },
  { id: 'm-008-2', ticketId: 'tk-008', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Emre Yıldız atandı.', createdAt: minsAgo(480), attachments: [] },
  { id: 'm-008-3', ticketId: 'tk-008', type: 'public_outbound', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Merhaba, sorunun farkındayız ve çözüm üzerinde çalışıyoruz. PDF servisimizde yüksek yük var, optimizasyon yapılıyor.', createdAt: minsAgo(400), attachments: [] },
  { id: 'm-008-4', ticketId: 'tk-008', type: 'internal_note', authorId: 'u6', authorName: 'Emre Yıldız', content: 'PDF servisinde memory leak var. Restart uygulandı ama kaynak sorununu çözmedi.', createdAt: minsAgo(350), attachments: [] },
  { id: 'm-008-5', ticketId: 'tk-008', type: 'public_inbound', authorId: null, authorName: 'Yapı Kredi Destek', content: 'Hâlâ sorun devam ediyor. Acilen çözülmesi gerekiyor. 200+ müşteri bekliyor.', createdAt: minsAgo(200), attachments: [] },
  { id: 'm-008-6', ticketId: 'tk-008', type: 'public_outbound', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Anlıyoruz. Altyapı ekibimiz kapasiteyi artırıyor. 2 saat içinde çözüm sağlayacağız.', createdAt: minsAgo(120), attachments: [] },
  { id: 'm-008-7', ticketId: 'tk-008', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'SLA süresi aşıldı.', createdAt: minsAgo(120), attachments: [] },

  // TK-009
  { id: 'm-009-1', ticketId: 'tk-009', type: 'public_inbound', authorId: null, authorName: 'Şeker Finansman Destek', content: 'Müşterilerimizin kredi limitini güncellemeye çalışıyoruz ancak "İşlem tamamlanamadı" hatası alıyoruz. 3 farklı müşteri için denedik, hepsinde aynı hata var.', createdAt: minsAgo(360), attachments: [] },
  { id: 'm-009-2', ticketId: 'tk-009', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Mehmet Demir atandı.', createdAt: minsAgo(360), attachments: [] },
  { id: 'm-009-3', ticketId: 'tk-009', type: 'public_outbound', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Konuyu aldık. Hangi müşteri ID\'leri için bu hatayı aldığınızı paylaşabilir misiniz?', createdAt: minsAgo(300), attachments: [] },
  { id: 'm-009-4', ticketId: 'tk-009', type: 'public_inbound', authorId: null, authorName: 'Şeker Finansman Destek', content: 'Müşteri IDs: 10234, 10235, 10238. Bu müşteriler için limit değerini 50.000 TL\'den 75.000 TL\'ye yükseltmeye çalışıyoruz.', createdAt: minsAgo(240), attachments: [] },
  { id: 'm-009-5', ticketId: 'tk-009', type: 'public_outbound', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Teşekkürler. Söz konusu müşteriler için limit güncelleme validerinde bir kontrol eksikliği var. Geliştirme ekibiyle konuşuyoruz.', createdAt: minsAgo(90), attachments: [] },

  // TK-012
  { id: 'm-012-1', ticketId: 'tk-012', type: 'public_inbound', authorId: null, authorName: 'Garanti BBVA IT', content: 'Gece yarısı toplu veri aktarım işlemi başarısız oldu. 15.000 kayıt aktarılamamış durumda. Sabah işlemleri başlamadan çözülmesi lazım.', createdAt: minsAgo(600), attachments: [] },
  { id: 'm-012-2', ticketId: 'tk-012', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Fatma Şahin atandı. Durum: İşlemde.', createdAt: minsAgo(600), attachments: [] },
  { id: 'm-012-3', ticketId: 'tk-012', type: 'public_outbound', authorId: 'u7', authorName: 'Fatma Şahin', content: 'Acil konuyu aldık. ETL pipeline loglarına bakıyoruz. Bağlantı bilgilerinize ihtiyacımız var.', createdAt: minsAgo(570), attachments: [] },
  { id: 'm-012-4', ticketId: 'tk-012', type: 'internal_note', authorId: 'u7', authorName: 'Fatma Şahin', content: 'Pipeline\'da disk doluluk hatası var. Log rotation çalışmamış. DBA çağırıyorum.', createdAt: minsAgo(540), attachments: [] },
  { id: 'm-012-5', ticketId: 'tk-012', type: 'public_inbound', authorId: null, authorName: 'Garanti BBVA IT', content: 'Bağlantı bilgileri e-mail ile gönderildi. Durum ne oldu?', createdAt: minsAgo(400), attachments: [] },
  { id: 'm-012-6', ticketId: 'tk-012', type: 'internal_note', authorId: 'u9', authorName: 'Burak Koç', content: 'Disk temizlendi, %85 boşaltıldı. Pipeline yeniden başlatıldı, izliyoruz.', createdAt: minsAgo(300), attachments: [] },
  { id: 'm-012-7', ticketId: 'tk-012', type: 'public_outbound', authorId: 'u7', authorName: 'Fatma Şahin', content: 'Sorun tespit edildi ve giderildi. ETL pipeline\'ı yeniden başlattık. Aktarım devam ediyor, yaklaşık 1 saat içinde tamamlanacak.', createdAt: minsAgo(30), attachments: [] },

  // TK-015
  { id: 'm-015-1', ticketId: 'tk-015', type: 'public_inbound', authorId: null, authorName: 'Allianz Destek', content: 'Merhaba,\n\nDashboard sayfamızdaki veriler güncellenmiyor. Sayfayı yenilemelere rağmen veriler eski kalmaya devam ediyor. Örneğin, sabah 09:00\'da güncellenen poliçe sayısı, saat 14:00\'de hâlâ 09:00\'daki değerleri gösteriyor.\n\nBu sorun yaklaşık 2 gündür devam ediyor ve raporlama süreçlerimizi olumsuz etkiliyor. İvedilikle çözülmesini rica ediyoruz.\n\nTeşekkürler,\nAllianz Destek', createdAt: minsAgo(1200), attachments: [] },
  { id: 'm-015-2', ticketId: 'tk-015', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Emre Yıldız atandı. Durum: İşlemde.', createdAt: minsAgo(1200), attachments: [] },
  { id: 'm-015-3', ticketId: 'tk-015', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Durum "new" → "in_progress" olarak güncellendi.', createdAt: minsAgo(1150), attachments: [] },
  { id: 'm-015-4', ticketId: 'tk-015', type: 'public_outbound', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Merhaba,\n\nBildiriminiz için teşekkürler. Dashboard veri güncelleme sorununu incelemeye başladık. Cache mekanizmasını kontrol ediyoruz. En kısa sürede geri dönüş sağlayacağız.', createdAt: minsAgo(1100), attachments: [] },
  { id: 'm-015-5', ticketId: 'tk-015', type: 'internal_note', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Dashboard\'un Redis cache\'i düzgün invalidate etmediği görünüyor. Cache TTL değerini kontrol etmem gerekiyor. Teknik analiz devam ediyor.', createdAt: minsAgo(800), attachments: [] },
  { id: 'm-015-6', ticketId: 'tk-015', type: 'public_inbound', authorId: null, authorName: 'Allianz Destek', content: 'Güncelleme geldi mi? Sabah toplantımız için raporlara ihtiyacımız var, durum nedir?', createdAt: minsAgo(400), attachments: [] },
  { id: 'm-015-7', ticketId: 'tk-015', type: 'public_outbound', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Çalışmalar devam ediyor. Cache invalidation stratejisini revize ediyoruz. Bugün içinde güncelleme paylaşacağız.', createdAt: minsAgo(380), attachments: [] },
  { id: 'm-015-8', ticketId: 'tk-015', type: 'internal_note', authorId: 'u6', authorName: 'Emre Yıldız', content: 'Cache konfigürasyonunda yanlış TTL değeri bulundu. Düzeltme kodu hazır, deployment onayı bekleniyor.', createdAt: minsAgo(250), attachments: [] },

  // TK-021 (Transferred)
  { id: 'm-021-1', ticketId: 'tk-021', type: 'public_inbound', authorId: null, authorName: 'Akbank Güvenlik', content: 'Şüpheli para transferi tespit ettik. İşlem ID: 88291. Müşteri no: 550234. Lütfen acilen kontrol edin ve gerekirse işlemi durdurun.', createdAt: minsAgo(600), attachments: [] },
  { id: 'm-021-2', ticketId: 'tk-021', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Trade ekibine atandı.', createdAt: minsAgo(600), attachments: [] },
  { id: 'm-021-3', ticketId: 'tk-021', type: 'public_outbound', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Konuyu aldık. İşlemi inceliyoruz. Gerekirse manuel müdahale yapacağız.', createdAt: minsAgo(580), attachments: [] },
  { id: 'm-021-4', ticketId: 'tk-021', type: 'internal_note', authorId: 'u4', authorName: 'Mehmet Demir', content: 'Bu işlem güvenlik ekibinin manuel incelemesini gerektiriyor. Ops\'a transfer gerekli.', createdAt: minsAgo(200), attachments: [] },
  { id: 'm-021-5', ticketId: 'tk-021', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket Operations ekibine transfer edildi. Transfer eden: Mehmet Demir. Neden: Güvenlik incelemesi gerekiyor.', createdAt: minsAgo(60), attachments: [] },

  // TK-024 (Resolved)
  { id: 'm-024-1', ticketId: 'tk-024', type: 'public_inbound', authorId: null, authorName: 'Yapı Kredi IT', content: 'Aylık rapor sayfamız çok yavaş yükleniyor. 3-4 dakika sürüyor. Daha önce 30 saniyeydi.', createdAt: minsAgo(4000), attachments: [] },
  { id: 'm-024-2', ticketId: 'tk-024', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket oluşturuldu. Zeynep Çelik atandı.', createdAt: minsAgo(4000), attachments: [] },
  { id: 'm-024-3', ticketId: 'tk-024', type: 'public_outbound', authorId: 'u5', authorName: 'Zeynep Çelik', content: 'Konuyu aldık. Sorgu performansını inceliyoruz.', createdAt: minsAgo(3900), attachments: [] },
  { id: 'm-024-4', ticketId: 'tk-024', type: 'internal_note', authorId: 'u5', authorName: 'Zeynep Çelik', content: 'N+1 sorgu problemi tespit edildi. Rapor modülünde optimize edilmemiş SQL var.', createdAt: minsAgo(3800), attachments: [] },
  { id: 'm-024-5', ticketId: 'tk-024', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Durum "İşlemde" olarak güncellendi.', createdAt: minsAgo(3700), attachments: [] },
  { id: 'm-024-6', ticketId: 'tk-024', type: 'public_outbound', authorId: 'u5', authorName: 'Zeynep Çelik', content: 'Sorun tespit edildi. Sorgu optimizasyonu yapıldı. Rapor artık 8 saniyede yükleniyor. Kontrol edebilir misiniz?', createdAt: minsAgo(600), attachments: [] },
  { id: 'm-024-7', ticketId: 'tk-024', type: 'public_inbound', authorId: null, authorName: 'Yapı Kredi IT', content: 'Evet, çözüldü! Çok hızlandı. Teşekkürler.', createdAt: minsAgo(550), attachments: [] },
  { id: 'm-024-8', ticketId: 'tk-024', type: 'system_event', authorId: null, authorName: 'Sistem', content: 'Ticket "Çözümlendi" olarak kapatıldı.', createdAt: minsAgo(500), attachments: [] },
]

export const mockTransferRecords: TransferRecord[] = [
  {
    id: 'tr-001',
    ticketId: 'tk-021',
    fromGroupId: 'g1',
    fromGroupName: 'Trade',
    toGroupId: 'g2',
    toGroupName: 'Operations',
    transferredByName: 'Mehmet Demir',
    reason: 'Bu işlem finansal güvenlik incelemesi gerektiriyor. Ops ekibinin manuel doğrulama yapması gerekiyor.',
    note: 'Transfer ID: TRF-2026-38291. Acil inceleme gerekli.',
    createdAt: new Date(new Date('2026-03-25T12:00:00Z').getTime() - 60 * 60000).toISOString(),
  },
  {
    id: 'tr-002',
    ticketId: 'tk-022',
    fromGroupId: 'g2',
    fromGroupName: 'Operations',
    toGroupId: 'g1',
    toGroupName: 'Trade',
    transferredByName: 'Fatma Şahin',
    reason: 'Altyapı güncellemesinden sonra oluşan bağlantı kopukluğu Trade ekibinin API entegrasyon konusunda destek sağlaması gerekiyor.',
    note: null,
    createdAt: new Date(new Date('2026-03-25T12:00:00Z').getTime() - 120 * 60000).toISOString(),
  },
  {
    id: 'tr-003',
    ticketId: 'tk-023',
    fromGroupId: 'g1',
    fromGroupName: 'Trade',
    toGroupId: 'g2',
    toGroupName: 'Operations',
    transferredByName: 'Zeynep Çelik',
    reason: 'Fatura entegrasyonu teknik altyapı sorunu — Operations çözebilir.',
    note: 'Müşteri ile ilgili önceki yazışmalar eklenmiştir.',
    createdAt: new Date(new Date('2026-03-25T12:00:00Z').getTime() - 180 * 60000).toISOString(),
  },
]
