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
    if (token == null || token.isEmpty) return;

    _socketService.connect(token);
    NotificationService().registerAndSendTokenToBackend(token);

    _subscription?.cancel();
    _subscription = _socketService.notificationStream.listen((notif) {
      if (NotificationService().isDuplicateNotification(notif.id)) return;
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
