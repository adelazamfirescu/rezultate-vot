﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using CSharpFunctionalExtensions;
using ElectionResults.Core.Infrastructure;
using ElectionResults.Core.Models;
using Newtonsoft.Json;

namespace ElectionResults.Core.Services
{
    public class ElectionPresenceAggregator : IElectionPresenceAggregator
    {
        private readonly IElectionConfigurationSource _electionConfigurationSource;

        public ElectionPresenceAggregator(IElectionConfigurationSource electionConfigurationSource)
        {
            _electionConfigurationSource = electionConfigurationSource;
        }

        public virtual async Task<Result<VotesPresence>> GetCurrentPresence()
        {
            try
            {
                var httpClient = new HttpClient();
                var files = _electionConfigurationSource.GetListOfFilesWithElectionResults();
                var presenceJson = files.FirstOrDefault(f => f.ResultsType == ResultsType.Presence);
                if (presenceJson == null)
                    return Result.Failure<VotesPresence>("File not available");
                var json = await httpClient.GetStringAsync(presenceJson?.URL);
                var votingPresenceResponse = JsonConvert.DeserializeObject<VotingPresenceResponse>(json);
                var permanentLists = votingPresenceResponse.Counties.Sum(c => c.VotersOnPermanentLists);
                var specialLists = votingPresenceResponse.Counties.Sum(c => c.VotersOnSpecialLists);
                var mobileVotes = votingPresenceResponse.Counties.Sum(c => c.MobileVotes);

                var diasporaVoters = votingPresenceResponse.Precinct.Sum(c => c.VotersOnSpecialLists);
                var enlistedVoters = votingPresenceResponse.Counties.Sum(c => c.InitialCount);
                var totalVoters = permanentLists + mobileVotes + (specialLists - diasporaVoters);
                var votesPresencePercentage = totalVoters / (decimal)enlistedVoters;
                var votesPresence = new VotesPresence
                {
                    EnlistedVoters = enlistedVoters,
                    PresencePercentage = Math.Round(votesPresencePercentage * 100, 2),
                    TotalNationalVotes = totalVoters,
                    TotalDiasporaVotes = diasporaVoters,
                    PermanentLists = permanentLists,
                    AdditionalLists = specialLists - diasporaVoters
                };
                return Result.Ok(votesPresence);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return Result.Failure<VotesPresence>(e.Message);
            }
        }

        public async Task<Result<VoteMonitoringStats>> GetVoteMonitoringStats()
        {
            var httpClient = new HttpClient();
            var files = _electionConfigurationSource.GetListOfFilesWithElectionResults();
            var voteMonitoringJson = files.FirstOrDefault(f => f.ResultsType == ResultsType.VoteMonitoring);
            var json = await httpClient.GetStringAsync(voteMonitoringJson.URL);
            var response = JsonConvert.DeserializeObject<List<MonitoringInfo>>(json);
            return Result.Ok(new VoteMonitoringStats
            {
                VoteInfo = response
            });
        }
    }
}