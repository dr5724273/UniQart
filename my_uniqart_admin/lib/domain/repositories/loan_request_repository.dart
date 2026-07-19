import '../entities/loan_request_entity.dart';

abstract class LoanRequestRepository {
  Future<List<LoanRequestEntity>> getPendingRequests({int page = 1, int limit = 50});
  Future<void> submitDecision(String requestId, String action, {String? adminNote, String? publicNote});
}
