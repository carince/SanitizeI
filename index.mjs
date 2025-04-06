import fs from "fs";
import path from "path";
import { select } from "@inquirer/prompts";
import chalk from "chalk";

async function getSaves() {
    const USERPROFILE = process.env.USERPROFILE;
    const playersSavesDir = path.join(
        USERPROFILE,
        "AppData",
        "LocalLow",
        "TVGS",
        "Schedule I",
        "Saves"
    );

    // Helper function for selection prompts
    const selectItem = async (items, message, mapFn) => {
        if (items.length === 0) return null;
        if (items.length === 1) return items[0];
        return await select({
            message: chalk.yellow(message),
            choices: items.map(mapFn),
        });
    };

    // Get available players (excluding TempPlayer)
    const playersDir = fs
        .readdirSync(playersSavesDir)
        .filter((player) => player !== "TempPlayer");

    if (playersDir.length === 0) {
        console.log(chalk.red.bold("No players found"));
        process.exit(0);
    }

    // Select player
    const selectedPlayer = await selectItem(
        playersDir,
        "Select player (STEAM64ID):",
        (player) => ({ key: player, value: player })
    );

    if (playersDir.length === 1)
        console.log(
            chalk.cyan(`Selected player: ${chalk.bold(selectedPlayer)}`)
        );

    // Get available saves
    const playerSavesPath = path.join(playersSavesDir, selectedPlayer);
    const saves = fs
        .readdirSync(playerSavesPath)
        .filter((save) => save !== "WriteTest.txt")
        .map((save) => {
            const savePath = path.join(playerSavesPath, save, "Game.json");
            try {
                if (fs.existsSync(savePath)) {
                    const gameData = JSON.parse(
                        fs.readFileSync(savePath, "utf-8")
                    );
                    if (gameData.OrganisationName) {
                        return {
                            saveDirectory: save,
                            organisationName: gameData.OrganisationName,
                        };
                    }
                }
            } catch {} // Ignore errors
            return null;
        })
        .filter(Boolean); // Filter out nulls

    if (saves.length === 0) {
        console.log(chalk.red.bold("No saves found"));
        process.exit(0);
    }

    // Select save
    const selectedSaveOrg = await selectItem(saves, "Select save:", (save) => ({
        key: save.saveDirectory,
        value: save.organisationName,
    }));

    const selectedSave = saves.find(
        (save) =>
            save.organisationName === selectedSaveOrg ||
            save.saveDirectory === selectedSaveOrg
    );

    if (saves.length === 1)
        console.log(
            chalk.cyan(
                `Selected save: ${chalk.bold(selectedSave.organisationName)}`
            )
        );

    return {
        player: selectedPlayer,
        ...selectedSave,
        savePath: path.join(
            playersSavesDir,
            selectedPlayer,
            selectedSave.saveDirectory
        ),
    };
}

async function cleanTrashItems(savePath) {
    const trashDir = path.join(savePath, "Trash");
    const trashJsonPath = path.join(trashDir, "Trash.json");
    const generatorsDir = path.join(trashDir, "Generators");
    const stats = { trashItemsCount: 0, generatorsCount: 0 };

    console.log(chalk.blue.underline("\nCleaning Process Started"));

    // Clean Trash.json
    try {
        if (fs.existsSync(trashJsonPath)) {
            const trashData = JSON.parse(
                fs.readFileSync(trashJsonPath, "utf-8")
            );
            if (trashData.Items?.length) {
                stats.trashItemsCount = trashData.Items.length;
                trashData.Items = [];
                fs.writeFileSync(
                    trashJsonPath,
                    JSON.stringify(trashData, null, 2)
                );
                console.log(
                    chalk.green(
                        `✓ Cleaned ${chalk.bold(
                            stats.trashItemsCount
                        )} items from Trash.json`
                    )
                );
            } else {
                console.log(chalk.gray("- No items found in Trash.json"));
            }
        } else {
            console.log(chalk.yellow("⚠ Trash.json not found"));
        }
    } catch (error) {
        console.error(
            chalk.red(`✗ Error cleaning Trash.json: ${error.message}`)
        );
    }

    // Clean Generator files
    try {
        if (fs.existsSync(generatorsDir)) {
            fs.readdirSync(generatorsDir)
                .filter(
                    (file) =>
                        file.startsWith("Generator_") && file.endsWith(".json")
                )
                .forEach((genFile) => {
                    try {
                        const genPath = path.join(generatorsDir, genFile);
                        const genData = JSON.parse(
                            fs.readFileSync(genPath, "utf-8")
                        );

                        if (genData.GeneratedItems?.length) {
                            stats.generatorsCount++;
                            genData.GeneratedItems = [];
                            fs.writeFileSync(
                                genPath,
                                JSON.stringify(genData, null, 2)
                            );
                        }
                    } catch {}
                });

            if (stats.generatorsCount > 0) {
                console.log(
                    chalk.green(
                        `✓ Cleaned ${chalk.bold(
                            stats.generatorsCount
                        )} generator files`
                    )
                );
            } else {
                console.log(chalk.gray("- No items found in generator files"));
            }
        } else {
            console.log(chalk.yellow("⚠ Generators directory not found"));
        }
    } catch (error) {
        console.error(
            chalk.red(`✗ Error cleaning generators: ${error.message}`)
        );
    }

    return stats;
}

console.log(chalk.magenta.bold("\n=== Sanitize I ===\n"));

getSaves()
    .then(async (result) => {
        console.log(
            chalk.cyan(
                `\nProcessing save: ${chalk.bold(result.organisationName)}`
            )
        );
        const { trashItemsCount, generatorsCount } = await cleanTrashItems(
            result.savePath
        );

        console.log(chalk.green.bold("\n=== Cleaning Complete ==="));
        console.log(
            chalk.white(
                `Summary: Cleaned ${chalk.green.bold(
                    trashItemsCount
                )} trash items and ${chalk.green.bold(
                    generatorsCount
                )} generators`
            )
        );
    })
    .catch((error) =>
        console.error(chalk.red.bold(`\nError: ${error.message}`))
    );
