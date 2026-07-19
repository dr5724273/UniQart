import '../entities/booking_entity.dart';

abstract class BookingRepository {
  Future<List<BookingEntity>> getPendingBookings({int page = 1, int limit = 50});
  Future<void> submitDecision(String bookingId, String action, {String? adminNote, String? publicNote});
}
