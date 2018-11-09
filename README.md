# Patient Flow Simulator
Manage a simulated hospital to understand patient flow bottlenecks. 

Try it here: https://khp-informatics.github.io/patient-flow-simulator 

# Description
This is a teaching tool designed to illustrate the analysis and management of patient flow in a simple, standalone web tool. Flow analysis includes A&E waiting times, ward occupancy and network analysis.

# Basic workflows
## Manage hospital over time
### Setup
* Simulation history = resume
* Patients = generate
### Notes
The main loop is to click “run”, monitor the performance for a few days, then pause to make management changes and click run again to continue. The main dashboard is the history tab where you can monitor day-by-day stats over time. Occupancy, queue length and delays are particularly useful to diagnose where problems are occurring or where savings can be made. The network tab is most useful if you run some of the built in analysis – e.g. nodes with high betweenness centrality will affect a high proportion of patients. 

## Optimise preset patients
### Setup
* Simulation history = resume
* Patients = preset
### Notes
In this mode everyone will get the same patients in the same order. If you refresh the page, the sequence goes back to the beginning. The challenge is to keep trying the same patients and optimise performance for them. This is something that is only possible in a simulation, but the value is you can explore “what if” scenarios with consistent inputs. If you get good performance, save the config and test how well it performs with new patients (as in “manage hospital over time” above). 

## Repeat previous set of patients
At any time you can pause the simulation and go back to the start of the previous day by changing “simulation history” to “repeat previous”. You will then receive the same patients again in the same order. As long as the simulation is set to “repeat previous”, you will continue to repeat the same day over and over. For example, if you see extremely bad performance one day, you can pause, analyse, and try to adapt. This is of course not a realistic option, but it can be a useful way to understand the impact of your decisions. You can then either refresh the page to reset the simulation and take what you learned into account, or change the mode to “resume” to keep going and receive new patients. 

## General notes
* By default the tool simulates 1 day (simulation steps = 24) per iteration
* When you click “run” it will keep simulating day by day until you click pause
* If you just click “run once” it runs 1 day then pauses
* “score” is a single metric to capture the overall performance of your hospital. It is quite strongly affected by low values, meaning you need to achieve balanced performance overall to score highly. The maximum score possible is 100%. It combines:
  * % of patients admitted or discharged from A&E in 4h
  * Staff time efficiency
  * Resource use efficiency
  * Length of stay efficiency
* If the hospital becomes completely full the A&E waits will become unrealistically long (e.g. 10s of hours) because there’s no way for patients to be sent away. 
* “download config” will download all of your ward management decisions. It can be uploaded with “change hospital” -> select file -> upload. It’s useful if you think you have a particularly good/interesting config. It’s also useful if the simulator starts to lag, which can happen after a few hundred runs (depending on the device), since you can download your config, refresh the page and continue.

# Simulation
src/Simulation.js contains the Patient, Ward and PatientGenerator classes

# Funding
This tool represents independent research funded by the National Institute for Health Research (NIHR) Biomedical Research Centre at South London and Maudsley NHS Foundation Trust and King’s College London.

# Contact
This project is currently under development in King's College London

Contact Dan Bean - daniel.bean@kcl.ac.uk

# Cite
Bean DM, Taylor P, Dobson RJB. A patient flow simulator for healthcare management education. BMJ Simulation and Technology Enhanced Learning. Published Online First: 07 October 2017. doi: 10.1136/bmjstel-2017-000251
[http://dx.doi.org/10.1136/bmjstel-2017-000251](http://dx.doi.org/10.1136/bmjstel-2017-000251)
