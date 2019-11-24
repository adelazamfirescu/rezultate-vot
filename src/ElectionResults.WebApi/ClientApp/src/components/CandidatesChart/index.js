import React from "react";
import { ChartBar } from "./ChartBar";
import CountiesSelect from "./CountiesSelect";
import { FormGroup, Col, Button, Media, Label, Container } from "reactstrap";
import code4RoGrey from '../../images/code4RoGrey.svg';
import ElectionPicker from '../../services/electionPicker';
let currentSelection = '';
let totalCountedVotes = 0;
let percentageCounted = 0;
let queryUrl = '';
export const ChartContainer = () => {
    const [showAll, toggleShowAll] = React.useState(false);
    const [candidates, setCandidates] = React.useState(null);
    const [counties, setCounties] = React.useState(null);
    const [voterTurnout, setVoterTurnout] = React.useState(null);
    const [displayQuestion, setDisplayQuestion] = React.useState(true);
    React.useEffect(() => {

        const fetchServerData = async () => {
            try {
                if (!queryUrl) {
                    queryUrl = `/api/results?electionId=${ElectionPicker.getSelection()}`;
                }
                console.log("Loading results component for " + ElectionPicker.getSelection());
                fetch(queryUrl)
                    .then(data => data.json())
                    .then(data => {
                        if (!data.candidates) {
                            return;
                        }
                        if (data.candidates.length <= 5) {
                            toggleShowAll(true);
                        }
                        data.candidates.forEach((c) => {
                            c.displayPercentage = c.percentage * 0.8 - 5;
                            if (c.percentage > 90) {
                                c.displayPercentage = c.percentage * 0.6;
                            }
                        });
                        setCandidates(data.candidates);
                        totalCountedVotes = data.totalCountedVotes;
                        percentageCounted = data.percentageCounted;
                        setVoterTurnout(data);
                        if (currentSelection) {
                            return;
                        }
                        const total = { label: "Total", id: "" };
                        const national = { label: "National", id: "national" };
                        const diaspora = { label: "Diaspora", id: "diaspora" };
                        const mail = { label: "Corespondență", id: "mail" };
                        data.counties.unshift(total, diaspora, national, mail);
                        setCounties(data.counties);
                    });
            } catch (e) {
                console.log(e);
            }
        };
        const onIdle = () => {
            console.log('results component is idle');
            clearInterval(timer);
            timer = null;
        }
        const onActive = () => {
            console.log('results component is active');
            fetchServerData();
            timer = setInterval(() => fetchServerData(), 1000 * 30);
        }
        const onSelectedElectionsChanged = () => {
            toggleShowAll(false);
            queryUrl = `/api/results?electionId=${ElectionPicker.getSelection()}`;
            fetchServerData();
        }
        window.addEventListener("selectedElectionsChanged", onSelectedElectionsChanged);
        window.addEventListener("onIdle", onIdle);
        window.addEventListener("onActive", onActive);
        fetchServerData();
        let timer = setInterval(() => fetchServerData(), 1000 * 30);
        return () => {
            console.log("cleaned up");
            clearInterval(timer);
            timer = null;
            window.removeEventListener("onIdle", onIdle);
            window.removeEventListener("onActive", onActive);
        };
    }, []);

    const selectionChanged = value => {
        currentSelection = value.id;
        queryUrl = `/api/results/?electionId=${ElectionPicker.getSelection()}&source=${value.id}&county=${value.countyName || ''}`;
        fetch(queryUrl)
            .then(data => data.json())
            .then(data => {
                console.log(data);

                if (!data.candidates) {
                    return;
                }
                if (data.candidates.length <= 5) {
                    toggleShowAll(true);
                }
                data.candidates.forEach((c) => {
                    c.displayPercentage = c.percentage * 0.8 - 5;
                });
                setCandidates(data.candidates);
                totalCountedVotes = data.totalCountedVotes;
                percentageCounted = data.percentageCounted;
                setVoterTurnout(data);
            })};

    return (
        <div>
            {candidates && voterTurnout ? (
                <div>
                    <div sm={12} className={"votes-container"}>
                        <p className={"container-text"}>
                            Rezultate Vot transparentizează întreg procesul electoral furnizând în timp real, într-o formă grafică intuitivă, ușor de înțeles, datele oficiale furnizate de către AEP și Birourile Electorale cât și datele preluate prin aplicația Monitorizare Vot dezvoltată de Code for Romania, despre alegerile din România.
      </p>
                        <div sm={3} className={"votes-numbers"}>
                            <h3 className={"votes-title"}>Voturi numărate</h3>
                            <div sm={3} className={"votes-results"}>
                                <p className={"votes-percent"}>
                                    {" "}
                                    {percentageCounted}%
                </p>
                                <p className={"votes-text"}>
                                    {" "}
                                    {totalCountedVotes.toLocaleString(undefined, {
                                        maximumFractionDigits: 2
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <FormGroup row>
                        <Col sm={3}>
                            <CountiesSelect counties={counties} onSelect={selectionChanged} />
                        </Col>
                    </FormGroup>
                    {(showAll ? candidates : candidates.slice(0, 5)).map(candidate => (
                        <ChartBar
                            key={candidate.id}
                            percent={candidate.percentage}
                            displayPercentage={candidate.displayPercentage}
                            imgUrl={candidate.imageUrl}
                            candidateName={candidate.name}
                            votesNumber={candidate.votes}
                        />
                    ))}
                    {!showAll ? (
                        <div className={"show-all-container"} sm={3}>
                            <Button className={"show-all-btn"} onClick={toggleShowAll}>
                                Afiseaza toti candidatii
              </Button>
                        </div>
                    ) : null}
                </div>
            ) : (
                    <div className={"default-container"}>
                        <div className={"votes-container"}>
                            <p className={"container-text"}>
                                Rezultate Vot transparentizează întreg procesul electoral furnizând în timp real, într-o formă grafică intuitivă, ușor de înțeles, datele oficiale furnizate de către AEP și Birourile Electorale cât și datele preluate prin aplicația Monitorizare Vot dezvoltată de Code for Romania, despre alegerile din România.
            </p>
                        </div>
                        {
                            displayQuestion ? <div className={"question"}>
                                <p className={"question-text"}>
                                    Cine va câștiga turul 2 de alegeri prezidențiale?
              </p>
                            </div> : ""
                        }
                    </div>
                )}
            
                    <div style={{ display: 'flex', marginBottom: '50px' }}>
                        <p style={{ position: 'relative', display: 'inline' }} className="becro">Date preluate de la <a href="https://prezenta.bec.ro" target="_blank" rel="noopener noreferrer">prezenta.bec.ro</a></p>
                        <Container style={{ display: 'flex', alignItems: 'left', justifyContent: 'flex-end', padding: '0px' }}>
                            <Label style={{ lineHeight: '18px' }} className="info-label">an app developed by</Label>
                            <Media src={code4RoGrey} />
                        </Container>
                    </div>

        </div>
    );
};
