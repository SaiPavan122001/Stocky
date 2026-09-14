// Package rewardworker simulates reward settlement: since there is no real
// brokerage/settlement to key off of, claimed rewards are advanced through
// pending -> processing -> credited automatically after short fixed delays,
// mirroring the UX the original mock data implied.
package rewardworker

import (
	"log"
	"time"

	"stocky/backend-go/internal/store"
)

const (
	pollInterval        = 10 * time.Second
	pendingToProcessing = 15 * time.Second
	processingToCredit  = 45 * time.Second
)

// Run blocks, polling for in-flight rewards until stop is closed.
func Run(s *store.Store, stop <-chan struct{}) {
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			tick(s)
		}
	}
}

func tick(s *store.Store) {
	rewards, err := s.ListInFlightRewards()
	if err != nil {
		log.Printf("rewardworker: list in-flight rewards: %v", err)
		return
	}

	for _, rw := range rewards {
		age := time.Since(rw.CreatedAt)

		switch {
		case rw.Status == "pending" && age >= pendingToProcessing:
			if err := s.UpdateRewardStatus(rw.ID, "processing"); err != nil {
				log.Printf("rewardworker: mark processing %s: %v", rw.ID, err)
			}

		case rw.Status == "processing" && age >= processingToCredit:
			if err := creditReward(s, rw); err != nil {
				log.Printf("rewardworker: credit %s: %v", rw.ID, err)
			}
		}
	}
}

func creditReward(s *store.Store, rw store.InFlightReward) error {
	price, err := s.CurrentPrice(rw.Symbol)
	if err != nil {
		return err
	}

	if err := s.AddToHolding(rw.UserID, rw.Symbol, rw.Quantity, price); err != nil {
		return err
	}
	if err := s.UpdateRewardStatus(rw.ID, "credited"); err != nil {
		return err
	}
	return s.InsertActivity(rw.UserID, "credit", rw.Symbol, rw.Quantity)
}
