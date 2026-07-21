import '../entities/finance_offer_entity.dart';

abstract class FinanceOfferRepository {
  Future<List<FinanceOfferEntity>> getPendingOffers({int page = 1, int limit = 20});
  Future<void> submitDecision(String offerId, String action, {String? adminNote, String? publicNote, double? overrideInterestRate, String? overrideTermsAndConditions});
}
