import '../entities/loan_request_entity.dart';

abstract class LoanRequestRepository {
  Future<List<LoanRequestEntity>> getPendingLoanRequests({int page = 1, int limit = 50});
  Future<LoanRequestEntity> submitDecision(String loanId, String action, {String? internalNotes});
}
