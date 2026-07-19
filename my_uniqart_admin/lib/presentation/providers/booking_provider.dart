import 'package:flutter/foundation.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../data/repositories/booking_repository_impl.dart';

class BookingProvider extends ChangeNotifier {
  final BookingRepository _repository;

  List<BookingEntity> _pendingBookings = [];
  bool _isLoading = false;
  String? _errorMessage;

  BookingProvider({BookingRepository? repository})
      : _repository = repository ?? BookingRepositoryImpl();

  List<BookingEntity> get pendingBookings => _pendingBookings;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchPendingBookings() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _pendingBookings = await _repository.getPendingBookings();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitDecision(String bookingId, String action, {String? adminNote, String? publicNote}) async {
    try {
      await _repository.submitDecision(bookingId, action, adminNote: adminNote, publicNote: publicNote);
      _pendingBookings.removeWhere((b) => b.id == bookingId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
