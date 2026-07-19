import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/network/socket_service.dart';
import '../../core/network/notification_service.dart';
import '../../core/storage/token_storage.dart';
import '../../domain/entities/admin_notification_entity.dart';

class NotificationProvider extends ChangeNotifier {
  final SocketService _socketService;
  final TokenStorage _tokenStorage;
  StreamSubscription<AdminNotificationEntity>? _subscription;

  final List<AdminNotificationEntity> _notifications = [];
  final Set<String> _seenIds = {};
  AdminNotificationEntity? _latestInAppNotification;

  NotificationProvider({SocketService? socketService, TokenStorage? tokenStorage})
      : _socketService = socketService ?? SocketService(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  List<AdminNotificationEntity> get notifications => _notifications;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;
  AdminNotificationEntity? get latestInAppNotification => _latestInAppNotification;

  Future<void> initSocketConnection() async {
    final token = await _tokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[NotificationProvider] No auth token found — skipping socket connection.');
      return;
    }

    debugPrint('[NotificationProvider] Auth token found. Connecting socket...');
    _socketService.connect(token);

    // Register FCM token to backend — retry up to 3 times if Firebase is still warming up
    bool fcmSent = false;
    for (int attempt = 1; attempt <= 3; attempt++) {
      try {
        await NotificationService().registerAndSendTokenToBackend(token);
        final fcmToken = NotificationService().fcmToken;
        if (fcmToken != null && fcmToken.isNotEmpty) {
          debugPrint('[NotificationProvider] FCM token registered successfully on attempt $attempt: ${fcmToken.substring(0, 20)}...');
          fcmSent = true;
          break;
        } else {
          debugPrint('[NotificationProvider] FCM token was null/empty on attempt $attempt — retrying in 2s...');
          await Future.delayed(const Duration(seconds: 2));
        }
      } catch (e) {
        debugPrint('[NotificationProvider] FCM token registration error on attempt $attempt: $e');
        await Future.delayed(const Duration(seconds: 2));
      }
    }
    if (!fcmSent) {
      debugPrint('[NotificationProvider] WARNING: FCM token was NOT registered after 3 attempts. Background/terminated notifications will NOT work.');
    }

    _subscription?.cancel();
    _subscription = _socketService.notificationStream.listen((notif) {
      debugPrint('[NotificationProvider] Received socket notification: ${notif.id} | ${notif.type} | ${notif.title}');
      if (NotificationService().isDuplicateNotification(notif.id)) {
        debugPrint('[NotificationProvider] Skipping duplicate notification: ${notif.id}');
        return;
      }
      if (!_seenIds.contains(notif.id)) {
        _seenIds.add(notif.id);
        _notifications.insert(0, notif);
        _latestInAppNotification = notif;
        notifyListeners();

        NotificationService().showSystemNotification(
          title: notif.title,
          body: notif.message,
          id: notif.id.hashCode,
          payload: '{"type":"${notif.type}","url":"${notif.url}"}',
        );
      }
    });
  }

  void clearLatestInAppNotification() {
    _latestInAppNotification = null;
    notifyListeners();
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index].isRead = true;
      notifyListeners();
    }
  }

  void markAllAsRead() {
    bool changed = false;
    for (var n in _notifications) {
      if (!n.isRead) {
        n.isRead = true;
        changed = true;
      }
    }
    if (changed) notifyListeners();
  }

  void disconnect() {
    _tokenStorage.getToken().then((token) {
      if (token != null && token.isNotEmpty) {
        NotificationService().unregisterTokenFromBackend(token);
      }
    });
    _subscription?.cancel();
    _socketService.disconnect();
    _notifications.clear();
    _seenIds.clear();
    _latestInAppNotification = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _socketService.disconnect();
    super.dispose();
  }
}
