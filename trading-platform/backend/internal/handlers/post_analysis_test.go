package handlers

import (
	"testing"

	"trading-platform/internal/models"
)

func TestPostIsAnalysis(t *testing.T) {
	if !postIsAnalysis("technical") {
		t.Fatal("technical should be analysis")
	}
	if !postIsAnalysis("") {
		t.Fatal("empty should count as analysis (not news)")
	}
	if postIsAnalysis("news") {
		t.Fatal("news should not be analysis")
	}
	if postIsAnalysis(" NEWS ") {
		t.Fatal("trimmed news should not be analysis")
	}
}

func TestFeedSortKeys(t *testing.T) {
	p := models.Post{AnalysisType: "technical", User: models.User{ExpertRatingAvg: 4.5}}
	ia, ex := feedSortKeys(p)
	if ia != 1 || ex != 4.5 {
		t.Fatalf("got ia=%d ex=%v", ia, ex)
	}
	p2 := models.Post{AnalysisType: "news", User: models.User{ExpertRatingAvg: 5}}
	ia2, ex2 := feedSortKeys(p2)
	if ia2 != 0 || ex2 != 0 {
		t.Fatalf("news got ia=%d ex=%v", ia2, ex2)
	}
}
